const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, saveMessage } = require('../controllers/chatController');

// Protect all routes
router.use(protect);

// Chat routes
router.route('/messages')
    .get(getMessages)
    .post(saveMessage);

module.exports = router; 