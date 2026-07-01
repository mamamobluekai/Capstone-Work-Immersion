const { Router } = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validator');
const validate = require('../validators/validate');
const loginLimiter = require('../middlewares/loginLimiter');
const authenticate = require('../middlewares/verifyToken');

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginLimiter, loginValidation, validate, login);
router.post('/logout', authenticate, logout);

module.exports = router;
