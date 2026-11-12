const models = require('../Model');

// Toggle a like on a post.
exports.likePost = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required' });

    const post = await models.post.findByPk(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existingLike = await models.like.findOne({ where: { userId, postId } });
    if (existingLike) {
      await existingLike.destroy();
      return res.status(200).json({ message: 'Post unliked' });
    }

    const newLike = await models.like.create({ userId, postId });
    return res.status(201).json({ message: 'Post liked', like: newLike });
  } catch (err) {
    return next(err);
  }
};

exports.getLikesByPost = async (req, res, next) => {
  try {
    const likes = await models.like.findAll({
      where: { postId: req.params.postId },
      include: { model: models.user, attributes: ['id', 'name'] },
    });
    return res.json(likes);
  } catch (err) {
    return next(err);
  }
};

exports.checkIfLiked = async (req, res, next) => {
  try {
    const like = await models.like.findOne({ where: { userId: req.user.userId, postId: req.params.postId } });
    return res.json({ liked: !!like });
  } catch (err) {
    return next(err);
  }
};
