const { Router } = require('express');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');
const {
  createSupervisorRequest,
  createDeploymentRequest,
  getMyDeploymentRequests,
  getSupervisorDeploymentRequests,
  getDeploymentRequestStudents,
  approveDeploymentRequest,
  rejectDeploymentRequest,
  deleteDeploymentRequest,
  fulfillSupervisorRequest,
} = require('../controllers/deployment.controller');

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('coordinator', 'admin'),
  createDeploymentRequest
);

router.post(
  '/supervisor-request',
  authenticate,
  authorize('supervisor'),
  createSupervisorRequest
);

router.get(
  '/coordinator/me',
  authenticate,
  authorize('coordinator', 'admin'),
  getMyDeploymentRequests
);

router.get(
  '/supervisor/me',
  authenticate,
  authorize('supervisor'),
  getSupervisorDeploymentRequests
);

router.get(
  '/:requestId/students',
  authenticate,
  authorize('coordinator', 'admin', 'supervisor'),
  getDeploymentRequestStudents
);

router.patch(
  '/:requestId/approve',
  authenticate,
  authorize('supervisor'),
  approveDeploymentRequest
);

router.patch(
  '/:requestId/reject',
  authenticate,
  authorize('supervisor'),
  rejectDeploymentRequest
);

router.patch(
  '/:requestId/fulfill',
  authenticate,
  authorize('coordinator', 'admin'),
  fulfillSupervisorRequest
);

router.delete(
  '/:requestId',
  authenticate,
  authorize('coordinator', 'admin'),
  deleteDeploymentRequest
);

module.exports = router;
