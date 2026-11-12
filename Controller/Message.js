const { Op } = require('sequelize');
const models = require('../Model');
const { getPagination, toPositiveInt } = require('../utils/pagination');

exports.sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.userId;
    const receiverId = toPositiveInt(req.body.receiverId, null);
    const content = (req.body.content || '').trim();

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required.' });
    }
    if (receiverId === senderId) {
      return res.status(400).json({ message: "You can't message yourself." });
    }

    const receiver = await models.user.findByPk(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found.' });

    const message = await models.message.create({ senderId, receiverId, content });
    return res.status(201).json({ message: 'Message sent', data: message });
  } catch (err) {
    return next(err);
  }
};

// Chat between the current user and another user, newest first.
exports.getChatWithUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const otherUserId = toPositiveInt(req.params.otherUserId, null);
    if (!otherUserId) return res.status(400).json({ message: 'Invalid user id' });

    const { limit, offset } = getPagination(req.query, 10);

    const messages = await models.message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      offset,
      limit,
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });

    return res.json(messages);
  } catch (err) {
    return next(err);
  }
};
