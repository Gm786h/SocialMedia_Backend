const express = require('express');
const auth = require('../Middleware/auth');
const { commentController } = require('../Controller');

const router = express.Router();

router.post('/', auth, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPost);

module.exports = router;
