const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Device CRUD routes
router.get('/', deviceController.getAllDevices);
router.get('/:id', deviceController.getDevice);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// Device monitoring routes
router.get('/:id/metrics', deviceController.getDeviceMetrics);
router.get('/:id/stats', deviceController.getDeviceStats);
router.post('/:id/ping', deviceController.pingDevice);
router.post('/:id/traceroute', deviceController.tracerouteDevice);

module.exports = router;
