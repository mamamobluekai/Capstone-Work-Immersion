const { body } = require('express-validator');

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().isLength({ min: 1, max: 100 }).escape().withMessage('First name is required'),
  body('last_name').trim().isLength({ min: 1, max: 100 }).escape().withMessage('Last name is required'),
  body('role').isIn(['coordinator', 'teacher', 'supervisor', 'student']).withMessage('Invalid role'),
  body('student_id').optional({ nullable: true }).trim().escape(),
  body('grade_level').optional({ nullable: true }).trim().escape(),
  body('strand').optional({ nullable: true }).trim().escape(),
  body('employee_id').optional({ nullable: true }).trim().escape(),
  body('department').optional({ nullable: true }).trim().escape(),
  body('company_name').optional({ nullable: true }).trim().escape(),
  body('designation').optional({ nullable: true }).trim().escape(),
  body('phone').optional({ nullable: true }).trim().escape(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

module.exports = { registerValidation, loginValidation };
