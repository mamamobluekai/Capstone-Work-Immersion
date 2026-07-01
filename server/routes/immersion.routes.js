const { Router } = require('express');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');
const {
  createTeacherBatch,
  updateTeacherBatch,
  deleteTeacherBatch,
  assignApprovedStudentsToBatch,
  getMyTeacherBatches,
  getTeacherBatchStudents,
  getTeachersListForCoordinator,
  getSupervisorsListForCoordinator,
  getCoordinatorBatchesWithAssignedStudents,
  getRequirementCompletedStudentsForCoordinator,
} = require('../controllers/immersion.controller');

const router = Router();

// Coordinator/admin creates/updates teacher batches
router.post(
  '/batches',
  authenticate,
  authorize('coordinator', 'admin'),
  createTeacherBatch
);

router.patch(
  '/batches/:batchId',
  authenticate,
  authorize('coordinator', 'admin'),
  updateTeacherBatch
);

router.delete(
  '/batches/:batchId',
  authenticate,
  authorize('coordinator', 'admin'),
  deleteTeacherBatch
);

// Assign students with completed requirements only (replace assignments for that batch)
router.post(
  '/batches/:batchId/students',
  authenticate,
  authorize('coordinator', 'admin'),
  assignApprovedStudentsToBatch
);

// Teacher view
router.get(
  '/batches/me',
  authenticate,
  authorize('teacher'),
  getMyTeacherBatches
);

router.get(
  '/batches/:batchId/students',
  authenticate,
  authorize('teacher', 'coordinator', 'admin'),
  getTeacherBatchStudents
);

// Allow coordinator to fetch supervisors
router.get(
  '/supervisors',
  authenticate,
  authorize('coordinator', 'admin'),
  getSupervisorsListForCoordinator
);

// Allow coordinator to fetch approved teachers to choose from
router.get(
  '/teachers',
  authenticate,
  authorize('coordinator', 'admin'),
  getTeachersListForCoordinator
);

// Students eligible for immersion assignment are based on completed requirements,
// not account approval status.
router.get(
  '/students/requirements-completed',
  authenticate,
  authorize('coordinator', 'admin'),
  getRequirementCompletedStudentsForCoordinator
);

// Coordinator view: batches created by this coordinator with assigned students
router.get(
  '/batches/coordinator/me',
  authenticate,
  authorize('coordinator', 'admin'),
  getCoordinatorBatchesWithAssignedStudents
);

module.exports = router;
