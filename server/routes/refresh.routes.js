const { Router } = require('express');
const { refreshToken } = require('../controllers/auth.controller');

const router = Router();

router.post('/refresh', refreshToken);

module.exports = router;
