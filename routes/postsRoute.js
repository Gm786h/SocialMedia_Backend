const express = require('express');
const auth = require('../Middleware/auth');
const upload = require('../Middleware/upload');
const { postController } = require('../Controller');

const router = express.Router();

router.post('/', auth, upload.single('image'), postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

module.exports = router;
