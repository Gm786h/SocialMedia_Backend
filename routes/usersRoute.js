const express = require('express');
const auth = require('../Middleware/auth');
const upload = require('../Middleware/upload');
const { userController, profileController } = require('../Controller');

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.getProfile);

router.post('/upload-profile', auth, upload.single('image'), profileController.uploadProfile);
router.get('/profile', auth, profileController.getProfile);

module.exports = router;
