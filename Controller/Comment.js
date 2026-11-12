const models = require('../Model');

exports.createComment = async (req, res, next) => {
  try {
    const { postId } = req.body;
    const content = (req.body.content || '').trim();

    if (!postId) return res.status(400).json({ message: 'postId is required' });
    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const post = await models.post.findByPk(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await models.comment.create({ content, userId: req.user.userId, postId });
    return res.status(201).json({ message: 'Comment created', comment });
  } catch (err) {
    return next(err);
  }
};

exports.getCommentsByPost = async (req, res, next) => {
  try {
    const comments = await models.comment.findAll({
      where: { postId: req.params.postId },
      include: [{ model: models.user, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']],
    });
    return res.json(comments);
  } catch (err) {
    return next(err);
  }
};
