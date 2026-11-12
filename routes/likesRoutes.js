const express = require('express');
const auth = require('../Middleware/auth');
const { likeController } = require('../Controller');

const router = express.Router();

router.get('/check/:postId', auth, likeController.checkIfLiked);
router.post('/like', auth, likeController.likePost);
router.get('/:postId', likeController.getLikesByPost);

module.exports = router;
