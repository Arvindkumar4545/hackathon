const express = require('express');
const router = express.Router();
const { getDbStatus } = require('../config/db');

router.get('/overview', (req, res) => {
  const database = getDbStatus();
  res.json({
    success: true,
    platform: 'FinPilot AI',
    databaseStatus: {
      connected: database.connected,
      host: database.host,
      persistent: database.connected,
      message: database.connected ? 'Account data is stored in MongoDB.' : 'MongoDB is not connected; account records are temporary.',
    },
  });
});

router.get('/status', (req, res) => {
  res.json({ success: true, status: getDbStatus() });
});

module.exports = router;
