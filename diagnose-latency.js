#!/usr/bin/env node

/**
 * Network Latency Diagnostic Tool
 * Helps identify the source of high latency issues
 * Uses native Windows ping command - no external dependencies needed
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const targets = [
  { name: 'Google DNS Primary', host: '8.8.8.8' },
  { name: 'Google DNS Secondary', host: '8.8.4.4' },
  { name: 'Cloudflare DNS', host: '1.1.1.1' },
  { name: 'OpenDNS', host: '208.67.222.222' },
  { name: 'Local Gateway', host: 'gateway' }, // Will be detected
];

async function getGateway() {
  try {
    const { stdout } = await execPromise('ipconfig');
    const match = stdout.match(/Default Gateway[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/i);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error detecting gateway:', error.message);
    return null;
  }
}

async function performPingTest(host, count = 10) {
  console.log(`\nPinging ${host}...`);

  try {
    // Windows ping: -n count, -w timeout in ms
    const { stdout } = await execPromise(`ping -n ${count} -w 2000 ${host}`, {
      timeout: 30000
    });

    // Parse Windows ping output
    const lines = stdout.split('\n');

    // Extract statistics
    const statsMatch = stdout.match(/Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/);
    const lossMatch = stdout.match(/\((\d+)% loss\)/);

    if (statsMatch) {
      const min = parseInt(statsMatch[1]);
      const max = parseInt(statsMatch[2]);
      const avg = parseInt(statsMatch[3]);
      const packetLoss = lossMatch ? parseInt(lossMatch[1]) : 0;

      // Calculate jitter (approximate from max-min)
      const jitter = (max - min) / 2;

      console.log('✓ Success');

      return { min, max, avg, jitter, packetLoss };
    } else {
      // Parse replies to count successes
      const replies = stdout.match(/Reply from/g);
      const replyCount = replies ? replies.length : 0;
      const packetLoss = ((count - replyCount) / count) * 100;

      if (replyCount === 0) {
        console.log('✗ Failed (100% packet loss)');
        return { min: null, max: null, avg: null, jitter: null, packetLoss: 100 };
      }

      console.log('⚠ Partial success');
      return { min: null, max: null, avg: null, jitter: null, packetLoss };
    }
  } catch (error) {
    console.log('✗ Failed');
    return { min: null, max: null, avg: null, jitter: null, packetLoss: 100 };
  }
}

async function performTraceroute(host) {
  console.log(`\nPerforming traceroute to ${host}...`);
  console.log('This may take 30-60 seconds...\n');

  try {
    const { stdout } = await execPromise(`tracert -h 15 ${host}`, {
      timeout: 90000
    });
    return stdout;
  } catch (error) {
    return `Traceroute failed: ${error.message}`;
  }
}

function analyzeResults(results, gateway) {
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS & RECOMMENDATIONS');
  console.log('='.repeat(70));

  let issuesFound = false;

  // Check gateway
  if (gateway && results['Local Gateway']) {
    const gwStats = results['Local Gateway'].stats;
    if (gwStats.avg === null) {
      console.log('\n❌ CRITICAL: LOCAL NETWORK ISSUE');
      console.log('   Problem: Cannot reach your router/gateway');
      console.log('   Solutions:');
      console.log('   • Check if router is powered on');
      console.log('   • Verify Ethernet cable is connected (if wired)');
      console.log('   • Check Wi-Fi connection status (if wireless)');
      console.log('   • Try connecting to router directly');
      issuesFound = true;
    } else if (gwStats.avg > 50) {
      console.log('\n❌ LOCAL NETWORK ISSUE');
      console.log(`   Problem: High latency to your router (${gwStats.avg}ms)`);
      console.log('   Possible causes:');
      console.log('   • Wi-Fi interference or weak signal');
      console.log('   • Router overload (too many devices)');
      console.log('   • Router hardware issues');
      console.log('   Solutions:');
      console.log('   • Switch to wired connection (Ethernet cable)');
      console.log('   • Move closer to Wi-Fi router');
      console.log('   • Restart your router (unplug 30 seconds)');
      console.log('   • Update router firmware');
      console.log('   • Reduce number of connected devices');
      issuesFound = true;
    } else if (gwStats.packetLoss > 5) {
      console.log('\n⚠️  LOCAL NETWORK WARNING');
      console.log(`   Problem: Packet loss to router (${gwStats.packetLoss}%)`);
      console.log('   Solutions:');
      console.log('   • Replace Ethernet cable if using wired');
      console.log('   • Check Wi-Fi signal strength');
      console.log('   • Restart router');
      issuesFound = true;
    }
  }

  // Check DNS servers
  const dnsServers = ['Google DNS Primary', 'Google DNS Secondary', 'Cloudflare DNS', 'OpenDNS'];
  const dnsStats = dnsServers
    .filter(name => results[name] && results[name].stats.avg !== null)
    .map(name => ({ name, avg: results[name].stats.avg }));

  if (dnsStats.length > 0) {
    const avgDnsLatency = dnsStats.reduce((sum, s) => sum + s.avg, 0) / dnsStats.length;
    const highLatencyServers = dnsStats.filter(s => s.avg > 200);

    if (avgDnsLatency > 200) {
      console.log('\n❌ INTERNET/ISP ISSUE');
      console.log(`   Problem: High latency to all DNS servers (avg ${avgDnsLatency.toFixed(0)}ms)`);
      console.log('   Possible causes:');
      console.log('   • ISP network congestion');
      console.log('   • Poor routing by ISP');
      console.log('   • ISP throttling or maintenance');
      console.log('   • Problem with your modem');
      console.log('   Solutions:');
      console.log('   • Restart your modem (unplug 30 seconds)');
      console.log('   • Contact your ISP with these test results');
      console.log('   • Check ISP status page for known outages');
      console.log('   • Test at different times to identify congestion patterns');
      issuesFound = true;
    } else if (highLatencyServers.length > 0 && highLatencyServers.length < dnsStats.length) {
      console.log('\n⚠️  SPECIFIC DNS SERVER ISSUE');
      highLatencyServers.forEach(server => {
        console.log(`   Problem: ${server.name} has high latency (${server.avg}ms)`);
      });

      const goodServers = dnsStats.filter(s => s.avg <= 100);
      if (goodServers.length > 0) {
        const best = goodServers.reduce((min, s) => s.avg < min.avg ? s : min);
        console.log(`   Recommendation: Switch to ${best.name} (${best.avg}ms)`);

        if (best.name.includes('Cloudflare')) {
          console.log('   Use DNS: 1.1.1.1 and 1.0.0.1');
        } else if (best.name.includes('Google')) {
          console.log('   Use DNS: 8.8.8.8 and 8.8.4.4');
        } else if (best.name.includes('OpenDNS')) {
          console.log('   Use DNS: 208.67.222.222 and 208.67.220.220');
        }
      }
      issuesFound = true;
    }
  }

  // Check packet loss across all
  const hasPacketLoss = Object.values(results).some(r => r.stats.packetLoss > 5);
  if (hasPacketLoss && !issuesFound) {
    console.log('\n⚠️  PACKET LOSS DETECTED');
    console.log('   Problem: Data packets being lost in transmission');
    console.log('   Possible causes:');
    console.log('   • Faulty network cable');
    console.log('   • Network hardware failure');
    console.log('   • Network congestion');
    console.log('   • Poor Wi-Fi signal');
    console.log('   Solutions:');
    console.log('   • Replace Ethernet cables');
    console.log('   • Test with different network hardware');
    console.log('   • Move closer to Wi-Fi router or use wired');
    issuesFound = true;
  }

  // Check jitter
  const highJitter = Object.entries(results)
    .filter(([name, data]) => data.stats.jitter !== null && data.stats.jitter > 50);

  if (highJitter.length > 0) {
    console.log('\n⚠️  CONNECTION INSTABILITY (High Jitter)');
    console.log('   Problem: Latency is varying significantly');
    highJitter.forEach(([name, data]) => {
      console.log(`   ${name}: ${data.stats.jitter.toFixed(0)}ms jitter`);
    });
    console.log('   This causes:');
    console.log('   • Video call quality issues');
    console.log('   • Gaming lag spikes');
    console.log('   • Unstable connections');
    console.log('   Solutions:');
    console.log('   • Prioritize traffic with QoS on router');
    console.log('   • Reduce concurrent network usage');
    console.log('   • Contact ISP if persistent');
    issuesFound = true;
  }

  if (!issuesFound) {
    console.log('\n✅ ALL SYSTEMS NORMAL');
    console.log('   No significant issues detected!');
    console.log('   Your network connection appears healthy.');
    console.log('\n   Current performance:');

    if (gateway && results['Local Gateway']) {
      const gwStats = results['Local Gateway'].stats;
      console.log(`   • Local Network: ${gwStats.avg}ms (Excellent)`);
    }

    if (dnsStats.length > 0) {
      const avgDns = dnsStats.reduce((sum, s) => sum + s.avg, 0) / dnsStats.length;
      const status = avgDns < 50 ? 'Excellent' : avgDns < 100 ? 'Good' : 'Acceptable';
      console.log(`   • Internet: ${avgDns.toFixed(0)}ms average (${status})`);
    }
  }
}

async function diagnose() {
  console.log('='.repeat(70));
  console.log(' '.repeat(15) + 'NETWORK LATENCY DIAGNOSTIC TOOL');
  console.log('='.repeat(70));

  // Detect gateway
  console.log('\n📡 Step 1: Detecting Network Gateway...');
  const gateway = await getGateway();
  if (gateway) {
    console.log(`   ✓ Gateway found: ${gateway}`);
    targets[4].host = gateway;
  } else {
    console.log('   ⚠ Could not detect gateway (will skip local network test)');
    targets.splice(4, 1);
  }

  // Perform ping tests
  console.log('\n🔍 Step 2: Testing Network Connections...');
  console.log('   Testing multiple servers to identify issues...\n');

  const results = {};

  for (const target of targets) {
    console.log(`\n${target.name} (${target.host})`);
    process.stdout.write('   Testing... ');
    const stats = await performPingTest(target.host);
    results[target.name] = { host: target.host, stats };
  }

  // Display results
  console.log('\n' + '='.repeat(70));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(70));

  for (const [name, data] of Object.entries(results)) {
    console.log(`\n${name} (${data.host}):`);
    if (data.stats.avg === null) {
      console.log('   Status: ❌ UNREACHABLE (100% packet loss)');
    } else {
      console.log(`   Latency: Min=${data.stats.min}ms, Avg=${data.stats.avg}ms, Max=${data.stats.max}ms`);
      console.log(`   Jitter: ${data.stats.jitter.toFixed(1)}ms (stability indicator)`);
      console.log(`   Packet Loss: ${data.stats.packetLoss}%`);

      // Status indicators
      const status = [];
      if (data.stats.avg > 200) status.push('⚠️  High latency');
      if (data.stats.jitter > 50) status.push('⚠️  High jitter (unstable)');
      if (data.stats.packetLoss > 5) status.push('⚠️  High packet loss');
      if (status.length === 0) status.push('✅ Healthy');

      console.log(`   Status: ${status.join(', ')}`);
    }
  }

  // Analyze and provide recommendations
  analyzeResults(results, gateway);

  // Traceroute option
  console.log('\n' + '='.repeat(70));
  console.log('ADVANCED DIAGNOSTICS');
  console.log('='.repeat(70));
  console.log('\nFor deeper analysis, you can run traceroute to see the path packets take:');
  console.log('   node diagnose-latency.js --traceroute 8.8.8.8');
  console.log('\nThis will show each network hop and help identify where delays occur.');
  console.log('='.repeat(70));
}

// Main execution
async function main() {
  if (process.argv.includes('--traceroute')) {
    const hostIndex = process.argv.indexOf('--traceroute') + 1;
    const host = process.argv[hostIndex] || '8.8.8.8';

    const output = await performTraceroute(host);
    console.log(output);

    console.log('\n' + '='.repeat(70));
    console.log('HOW TO ANALYZE TRACEROUTE RESULTS:');
    console.log('='.repeat(70));
    console.log('\n1. Hop 1 should be your local gateway (router)');
    console.log('   • Should be <5ms');
    console.log('   • If high, check your local network\n');
    console.log('2. Hops 2-4 are usually your ISP');
    console.log('   • Should be <50ms');
    console.log('   • If high, contact your ISP\n');
    console.log('3. Later hops are the internet backbone');
    console.log('   • Gradual increase is normal (distance)');
    console.log('   • Sudden spike = problem at that location\n');
    console.log('4. Asterisks (*) indicate:');
    console.log('   • Router not responding (may be normal)');
    console.log('   • Or timeout/filtering\n');
    console.log('5. Look for:');
    console.log('   • Consistent high latency at specific hop');
    console.log('   • Large increase between two hops');
    console.log('   • Timeouts after a specific hop');
    console.log('='.repeat(70));
  } else if (process.argv.includes('--help')) {
    console.log('Network Latency Diagnostic Tool\n');
    console.log('Usage:');
    console.log('  node diagnose-latency.js              Run full diagnostic');
    console.log('  node diagnose-latency.js --traceroute <host>  Trace route to host');
    console.log('  node diagnose-latency.js --help       Show this help\n');
    console.log('Examples:');
    console.log('  node diagnose-latency.js');
    console.log('  node diagnose-latency.js --traceroute 8.8.8.8');
    console.log('  node diagnose-latency.js --traceroute google.com');
  } else {
    await diagnose();
  }
}

main().catch(console.error);
