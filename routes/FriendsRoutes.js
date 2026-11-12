const express = require('express');
const auth = require('../Middleware/auth');
const { friendRequestController: friends } = require('../Controller');

const router = express.Router();

router.post('/send', auth, friends.sendRequest);
router.get('/received', auth, friends.getReceivedRequests);
router.post('/accept/:requestId', auth, friends.acceptRequest);
router.post('/cancel', auth, friends.cancelRequest);
router.get('/list', auth, friends.getAllFriends);
router.delete('/unfriend/:friendId', auth, friends.unfriend);
router.get('/search', auth, friends.searchUsers);

module.exports = router;
