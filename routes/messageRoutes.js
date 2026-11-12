const express = require('express');
const auth = require('../Middleware/auth');
const { messageController } = require('../Controller');

const router = express.Router();

router.post('/send', auth, messageController.sendMessage);
router.get('/:otherUserId', auth, messageController.getChatWithUser);

module.exports = router;
