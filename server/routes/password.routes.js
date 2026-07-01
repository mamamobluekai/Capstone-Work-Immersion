const { Router } = require('express');
const { setPassword } = require('../controllers/student.controller');

const router = Router();

router.post('/set-password', setPassword);

module.exports = router;
