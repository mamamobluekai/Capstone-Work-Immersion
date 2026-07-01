const { Router } = require('express');
const {
  upload,
  uploadStudentsExcel,
  uploadTeachersExcel,
  uploadSupervisorsExcel,
  getStudents,
  getStudentById,
  approveStudent,
  disapproveStudent,
  deleteStudent,
  setStudentPassword,
} = require('../controllers/student.controller');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');

const router = Router();

router.get('/', authenticate, authorize('coordinator', 'admin'), getStudents);
router.get('/:id', authenticate, authorize('coordinator', 'admin'), getStudentById);
router.post('/upload', authenticate, authorize('coordinator', 'admin'), upload.single('file'), uploadStudentsExcel);
router.post('/upload-teachers', authenticate, authorize('coordinator', 'admin'), upload.single('file'), uploadTeachersExcel);
router.post('/upload-supervisors', authenticate, authorize('coordinator', 'admin'), upload.single('file'), uploadSupervisorsExcel);
router.patch('/:id/approve', authenticate, authorize('coordinator'), approveStudent);
router.patch('/:id/disapprove', authenticate, authorize('coordinator'), disapproveStudent);
router.delete('/:id', authenticate, authorize('coordinator', 'admin'), deleteStudent);
router.patch('/:id/set-password', authenticate, authorize('coordinator', 'admin'), setStudentPassword);

module.exports = router;
