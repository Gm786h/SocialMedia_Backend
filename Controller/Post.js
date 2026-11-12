const models = require('../Model');
const { getPagination } = require('../utils/pagination');

const postIncludes = () => [
  { model: models.user, attributes: ['id', 'name', 'profileImage'] },
  { model: models.like, include: { model: models.user, attributes: ['id', 'name'] } },
  { model: models.comment, include: { model: models.user, attributes: ['id', 'name'] } },
];

exports.createPost = async (req, res, next) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Post content is required' });

    const image = req.file?.path || null;
    const post = await models.post.create({ content, userId: req.user.userId, image });
    return res.status(201).json({ message: 'Post created', post });
  } catch (err) {
    return next(err);
  }
};

exports.getAllPosts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query, 18);

    const totalPosts = await models.post.count();
    const posts = await models.post.findAll({
      include: postIncludes(),
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({ totalPages: Math.ceil(totalPosts / limit), totalPosts, posts, page });
  } catch (err) {
    return next(err);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const post = await models.post.findOne({ where: { id: req.params.id }, include: postIncludes() });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.json(post);
  } catch (err) {
    return next(err);
  }
};
