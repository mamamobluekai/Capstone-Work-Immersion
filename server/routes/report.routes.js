const { Router } = require('express');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');
const { getSummaryReport, getReports, sendReportToAdmin } = require('../controllers/report.controller');

const router = Router();

router.get('/', authenticate, authorize('coordinator', 'admin'), getReports);
router.get('/summary', authenticate, authorize('coordinator', 'admin'), getSummaryReport);
router.post('/send-to-admin', authenticate, authorize('coordinator', 'admin'), sendReportToAdmin);

module.exports = router;