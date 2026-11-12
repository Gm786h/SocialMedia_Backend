const express = require('express');

const router = express.Router();

router.use('/users', require('./usersRoute'));
router.use('/posts', require('./postsRoute'));
router.use('/comments', require('./commentsRoutes'));
router.use('/likes', require('./likesRoutes'));
router.use('/friends', require('./FriendsRoutes'));
router.use('/messages', require('./messageRoutes'));

module.exports = router;
