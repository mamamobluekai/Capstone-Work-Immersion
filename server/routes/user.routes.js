const { Router } = require('express');
const {
  getAllUsers,
  getCoordinators,
  getUsersByStatus,
  approveUser,
  disapproveUser,
  approveCoordinator,
  disapproveCoordinator,
  deleteUser,
} = require('../controllers/user.controller');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');

const router = Router();

router.get('/', authenticate, authorize('admin', 'coordinator'), getAllUsers);
router.get('/coordinators', authenticate, authorize('supervisor', 'coordinator', 'admin'), getCoordinators);
router.get('/status/:status', authenticate, authorize('admin', 'coordinator'), getUsersByStatus);
router.patch('/:id/approve', authenticate, authorize('coordinator'), approveUser);
router.patch('/:id/disapprove', authenticate, authorize('coordinator'), disapproveUser);
router.patch('/:id/approve-coordinator', authenticate, authorize('admin'), approveCoordinator);
router.patch('/:id/disapprove-coordinator', authenticate, authorize('admin'), disapproveCoordinator);
router.delete('/:id', authenticate, authorize('coordinator', 'admin'), deleteUser);

module.exports = router;
