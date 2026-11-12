const models = require('../Model');

const uploadProfile = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = req.file.path;
    await models.user.update({ profileImage: imageUrl }, { where: { id: req.user.userId } });

    return res.json({ message: 'Profile image uploaded', imageUrl });
  } catch (err) {
    return next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await models.user.findByPk(req.user.userId, {
      attributes: ['id', 'name', 'email', 'profileImage'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return next(err);
  }
};

module.exports = { uploadProfile, getProfile };
