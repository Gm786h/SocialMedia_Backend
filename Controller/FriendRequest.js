const { Op } = require('sequelize');
const models = require('../Model');
const { getPagination, toPositiveInt } = require('../utils/pagination');

const findFriendship = (a, b) =>
  models.friend.findOne({
    where: {
      [Op.or]: [
        { userId1: a, userId2: b },
        { userId1: b, userId2: a },
      ],
    },
  });

// Send a friend request. If the other user already sent one, both become friends.
exports.sendRequest = async (req, res, next) => {
  try {
    const senderId = req.user.userId;
    const receiverId = toPositiveInt(req.body.receiverId, null);

    if (!receiverId) return res.status(400).json({ message: 'receiverId is required.' });
    if (senderId === receiverId) {
      return res.status(400).json({ message: "You can't send a request to yourself." });
    }

    const receiver = await models.user.findByPk(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found.' });

    if (await findFriendship(senderId, receiverId)) {
      return res.status(400).json({ message: 'You are already friends.' });
    }

    const reverseRequest = await models.friendRequest.findOne({
      where: { senderId: receiverId, receiverId: senderId, status: 'pending' },
    });
    if (reverseRequest) {
      await reverseRequest.update({ status: 'accepted' });
      await models.friend.create({ userId1: senderId, userId2: receiverId });
      return res.status(200).json({ message: "Mutual requests detected. You're now friends!" });
    }

    const existingRequest = await models.friendRequest.findOne({
      where: { senderId, receiverId, status: 'pending' },
    });
    if (existingRequest) return res.status(400).json({ message: 'Friend request already sent.' });

    const request = await models.friendRequest.create({ senderId, receiverId, status: 'pending' });
    return res.status(201).json({ message: 'Friend request sent.', request });
  } catch (err) {
    return next(err);
  }
};

exports.getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await models.friendRequest.findAll({
      where: { receiverId: req.user.userId, status: 'pending' },
      include: [{ model: models.user, as: 'sender', attributes: ['id', 'name', 'profileImage'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json(requests);
  } catch (err) {
    return next(err);
  }
};

exports.acceptRequest = async (req, res, next) => {
  try {
    const receiverId = req.user.userId;
    const requestId = toPositiveInt(req.params.requestId, null);
    if (!requestId) return res.status(400).json({ message: 'Invalid request id.' });

    const request = await models.friendRequest.findOne({
      where: { id: requestId, receiverId, status: 'pending' },
    });
    if (!request) return res.status(404).json({ message: 'Friend request not found.' });

    request.status = 'accepted';
    await request.save();

    if (await findFriendship(request.senderId, request.receiverId)) {
      return res.status(400).json({ message: 'You are already friends.' });
    }

    await models.friend.create({ userId1: request.senderId, userId2: request.receiverId });
    return res.json({ message: 'Friend request accepted and friendship created.' });
  } catch (err) {
    return next(err);
  }
};

exports.getAllFriends = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset } = getPagination(req.query, 20);

    const friendships = await models.friend.findAll({
      where: { [Op.or]: [{ userId1: userId }, { userId2: userId }] },
    });
    const friendIds = friendships.map((f) => (Number(f.userId1) === userId ? f.userId2 : f.userId1));
    if (!friendIds.length) return res.json({ friends: [] });

    const friends = await models.user.findAll({
      where: { id: { [Op.in]: friendIds } },
      attributes: ['id', 'name', 'email', 'profileImage'],
      order: [['name', 'ASC']],
      limit,
      offset,
    });
    return res.json({ friends });
  } catch (err) {
    return next(err);
  }
};

exports.unfriend = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const friendId = toPositiveInt(req.params.friendId, null);
    if (!friendId) return res.status(400).json({ message: 'Invalid friend id.' });

    const deleted = await models.friend.destroy({
      where: {
        [Op.or]: [
          { userId1: userId, userId2: friendId },
          { userId1: friendId, userId2: userId },
        ],
      },
    });
    if (deleted === 0) return res.status(404).json({ message: 'Friendship not found.' });

    return res.json({ message: 'Successfully unfriended.' });
  } catch (err) {
    return next(err);
  }
};

// Cancel a pending request in either direction:
// - as the receiver (decline): body { senderId }
// - as the sender (withdraw):  body { receiverId }
exports.cancelRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const senderId = toPositiveInt(req.body.senderId, null);
    const receiverId = toPositiveInt(req.body.receiverId, null);

    let where;
    if (senderId) where = { senderId, receiverId: userId, status: 'pending' };
    else if (receiverId) where = { senderId: userId, receiverId, status: 'pending' };
    else return res.status(400).json({ message: 'senderId or receiverId is required.' });

    const request = await models.friendRequest.findOne({ where });
    if (!request) return res.status(404).json({ message: 'Pending friend request not found.' });

    request.status = 'cancelled';
    await request.save();
    return res.json({ message: 'Friend request cancelled successfully.' });
  } catch (err) {
    return next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const query = (req.query.query || '').trim();
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const users = await models.user.findAll({
      where: { name: { [Op.like]: `%${query}%` }, id: { [Op.ne]: userId } },
      attributes: ['id', 'name', 'profileImage'],
      limit: 50,
    });
    if (!users.length) return res.json([]);

    const userIds = users.map((u) => u.id);
    const [friends, sentRequests, receivedRequests] = await Promise.all([
      models.friend.findAll({
        where: {
          [Op.or]: [
            { userId1: userId, userId2: { [Op.in]: userIds } },
            { userId2: userId, userId1: { [Op.in]: userIds } },
          ],
        },
      }),
      models.friendRequest.findAll({
        where: { senderId: userId, receiverId: { [Op.in]: userIds }, status: 'pending' },
      }),
      models.friendRequest.findAll({
        where: { receiverId: userId, senderId: { [Op.in]: userIds }, status: 'pending' },
      }),
    ]);

    const friendSet = new Set(friends.map((f) => (Number(f.userId1) === userId ? f.userId2 : f.userId1)));
    const sentSet = new Set(sentRequests.map((r) => r.receiverId));
    const receivedSet = new Set(receivedRequests.map((r) => r.senderId));

    return res.json(
      users.map((user) => {
        let status = 'none';
        if (friendSet.has(user.id)) status = 'friends';
        else if (sentSet.has(user.id)) status = 'request_sent';
        else if (receivedSet.has(user.id)) status = 'request_received';
        return { id: user.id, name: user.name, profileImage: user.profileImage, status };
      })
    );
  } catch (err) {
    return next(err);
  }
};
