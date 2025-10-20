const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', dashboardController.getDashboardOverview);
router.get('/topology', dashboardController.getNetworkTopology);
router.get('/activity', dashboardController.getNetworkActivity);
router.get('/metrics', dashboardController.getAggregatedMetrics);

module.exports = router;
