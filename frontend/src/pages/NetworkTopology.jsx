import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { toast } from 'react-toastify';
import { dashboardAPI } from '../services/api';

const NetworkTopology = () => {
  const svgRef = useRef();
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopology();
  }, []);

  useEffect(() => {
    if (topology.nodes.length > 0) {
      renderTopology();
    }
  }, [topology]);

  const fetchTopology = async () => {
    try {
      const response = await dashboardAPI.getTopology();
      setTopology(response.data);
    } catch (error) {
      toast.error(`Failed to load network topology: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderTopology = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    const simulation = d3.forceSimulation(topology.nodes)
      .force('link', d3.forceLink(topology.links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    const g = svg.append('g');

    // Add zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(topology.links)
      .enter().append('line')
      .attr('stroke', d => d.status === 'online' ? '#10b981' : '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(topology.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node circles
    node.append('circle')
      .attr('r', 25)
      .attr('fill', d => {
        if (d.status === 'online') return '#10b981';
        if (d.status === 'offline') return '#ef4444';
        if (d.status === 'warning') return '#f59e0b';
        return '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node labels
    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('font-size', '12px')
      .attr('fill', '#374151');

    // Node tooltips
    node.append('title')
      .text(d => `${d.name}\n${d.ip || ''}\nStatus: ${d.status || 'unknown'}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Network Topology</h1>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Interactive network visualization</p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="600"
          className="border border-gray-200 rounded-lg bg-gray-50"
        />
      </div>
    </div>
  );
};

export default NetworkTopology;
