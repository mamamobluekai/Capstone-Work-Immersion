const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateTempToken(studentId) {
  return jwt.sign({ studentId, type: 'activation' }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

const uploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty.' });
    }

    const requiredColumns = ['Student ID', 'First Name', 'Last Name', 'Email', 'Grade Level', 'Strand'];
    const headers = Object.keys(rows[0]);
    const missing = requiredColumns.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing columns: ${missing.join(', ')}` });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const studentId = String(row['Student ID']).trim();
        const firstName = String(row['First Name']).trim();
        const lastName = String(row['Last Name']).trim();
        const email = String(row['Email']).trim();
        const gradeLevel = String(row['Grade Level']).trim();
        const strand = String(row['Strand']).trim();
        const phone = String(row['Phone'] || '').trim();

        if (!studentId || !firstName || !lastName || !email) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Invalid email: ${email}` });
          continue;
        }

        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 OR student_id = $2',
          [email, studentId]
        );
        if (existing.rows.length > 0) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Duplicate: ${email} or ${studentId}` });
          continue;
        }

        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10) + 'A1!', 10);

        await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role, student_id, grade_level, strand, phone, status)
           VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8, 'pending')`,
          [email, hashedPassword, firstName, lastName, studentId, gradeLevel, strand, phone || null]
        );

        const token = generateTempToken(studentId);
        const setupUrl = `${getClientUrl()}/set-password?token=${token}`;

        await transporter.sendMail({
          from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Work Immersion Account - Set Your Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2a5298;">Welcome to Work Immersion Management System</h2>
              <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
              <p>Your student account has been created by your coordinator. Please set your password to activate your account.</p>
              <p><strong>Student ID:</strong> ${studentId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p style="margin: 20px 0;">
                <a href="${setupUrl}" style="background: #2a5298; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Set Your Password
                </a>
              </p>
              <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you didn't expect this email, please ignore it.</p>
              <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
            </div>
          `,
        });

        results.success++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      message: `Upload complete. ${results.success} students added, ${results.failed} failed.`,
      results,
    });
  } catch (err) {
    console.error('Excel upload error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
};

const uploadTeachersExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty.' });
    }

    const requiredColumns = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Password'];
    const headers = Object.keys(rows[0]);
    const missing = requiredColumns.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing columns: ${missing.join(', ')}` });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const employeeId = String(row['Employee ID']).trim();
        const firstName = String(row['First Name']).trim();
        const lastName = String(row['Last Name']).trim();
        const email = String(row['Email']).trim();
        const department = String(row['Department']).trim();
        const position = String(row['Position']).trim();
        const password = String(row['Password']).trim();
        const phone = String(row['Phone Number'] || '').trim();

        if (!employeeId || !firstName || !lastName || !email || !department || !position || !password) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Invalid email: ${email}` });
          continue;
        }

        if (password.length < 8) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Password must be at least 8 characters' });
          continue;
        }

        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
          [email, employeeId]
        );
        if (existing.rows.length > 0) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Duplicate: ${email} or ${employeeId}` });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role, employee_id, department, phone, status)
           VALUES ($1, $2, $3, $4, 'teacher', $5, $6, $7, 'pending')`,
          [email, hashedPassword, firstName, lastName, employeeId, department, phone || null]
        );

        await transporter.sendMail({
          from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Work Immersion Teacher Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2a5298;">Welcome to Work Immersion Management System</h2>
              <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
              <p>Your teacher account has been created by the coordinator. Your account is pending approval.</p>
              <p><strong>Employee ID:</strong> ${employeeId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Department:</strong> ${department}</p>
              <p style="color: #666; font-size: 12px;">You will be notified once your account is approved.</p>
              <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
            </div>
          `,
        });

        results.success++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      message: `Upload complete. ${results.success} teachers added, ${results.failed} failed.`,
      results,
    });
  } catch (err) {
    console.error('Excel upload error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
};

const uploadSupervisorsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty.' });
    }

    const requiredColumns = ['Employee ID', 'Company Name', 'Supervisor First Name', 'Supervisor Last Name', 'Position', 'Email', 'Password'];
    const headers = Object.keys(rows[0]);
    const missing = requiredColumns.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing columns: ${missing.join(', ')}` });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const employeeId = String(row['Employee ID']).trim();
        const companyName = String(row['Company Name']).trim();
        const firstName = String(row['Supervisor First Name']).trim();
        const lastName = String(row['Supervisor Last Name']).trim();
        const position = String(row['Position']).trim();
        const email = String(row['Email']).trim();
        const password = String(row['Password']).trim();
        const department = String(row['Department'] || '').trim();
        const phone = String(row['Phone Number'] || '').trim();

        if (!employeeId || !companyName || !firstName || !lastName || !position || !email || !password) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Invalid email: ${email}` });
          continue;
        }

        if (password.length < 8) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Password must be at least 8 characters' });
          continue;
        }

        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
          [email, employeeId]
        );
        if (existing.rows.length > 0) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Duplicate: ${email} or ${employeeId}` });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role, employee_id, company_name, designation, department, phone, status)
           VALUES ($1, $2, $3, $4, 'supervisor', $5, $6, $7, $8, $9, 'pending')`,
          [email, hashedPassword, firstName, lastName, employeeId, companyName, position, department || null, phone || null]
        );

        await transporter.sendMail({
          from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Work Immersion Supervisor Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2a5298;">Welcome to Work Immersion Management System</h2>
              <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
              <p>Your supervisor account has been created by the coordinator. Your account is pending approval.</p>
              <p><strong>Employee ID:</strong> ${employeeId}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p style="color: #666; font-size: 12px;">You will be notified once your account is approved.</p>
              <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
            </div>
          `,
        });

        results.success++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      message: `Upload complete. ${results.success} supervisors added, ${results.failed} failed.`,
      results,
    });
  } catch (err) {
    console.error('Excel upload error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
};

const getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, student_id, grade_level, strand, phone, status, created_at
       FROM users WHERE role = 'student'
       ORDER BY created_at DESC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, student_id, grade_level, strand, phone, status, created_at
       FROM users WHERE id = $1 AND role = 'student'`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'coordinator_approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'student' AND status = 'pending'
       RETURNING id, email, first_name, last_name, student_id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found or already processed.' });
    }

    const student = result.rows[0];
    const token = generateTempToken(student.student_id);
    const setupUrl = `${getClientUrl()}/set-password?token=${token}`;

    await transporter.sendMail({
      from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: 'Your Work Immersion Account is Activated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a5298;">Account Activated</h2>
          <p>Hello <strong>${student.first_name} ${student.last_name}</strong>,</p>
          <p>Your Work Immersion Management System account has been activated by your coordinator. You can now set your password to access your account.</p>
          <p><strong>Student ID:</strong> ${student.student_id}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p style="margin: 20px 0;">
            <a href="${setupUrl}" style="background: #2a5298; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Set Your Password
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you didn't expect this email, please ignore it.</p>
          <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
        </div>
      `,
    });

    res.json({ message: 'Student approved and activation email sent.', student });
  } catch (err) {
    console.error('Approve student error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const disapproveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'disapproved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'student' AND status = 'pending'
       RETURNING id, email, first_name, last_name, student_id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found or already processed.' });
    }
    res.json({ message: 'Student disapproved.', student: result.rows[0] });
  } catch (err) {
    console.error('Disapprove student error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM teacher_batch_students WHERE student_id = $1', [id]);
      await client.query('DELETE FROM student_documents WHERE student_id = $1', [id]);
      await client.query('DELETE FROM student_requirement_submissions WHERE student_id = $1 OR user_id = $1 OR reviewed_by = $1', [id]);
      await client.query('DELETE FROM submission_logs WHERE actor_id = $1', [id]);
      await client.query('DELETE FROM students WHERE user_id = $1', [id]);
      const result = await client.query("DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING id", [id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Student not found.' });
      }
      await client.query('COMMIT');
      res.json({ message: 'Student deleted.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    if (decoded.type !== 'activation') {
      return res.status(400).json({ error: 'Invalid token type.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password = $1, status = 'coordinator_approved', updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $2 AND role = 'student' AND status IN ('pending', 'coordinator_approved')
       RETURNING id, email, first_name, last_name`,
      [hashedPassword, decoded.studentId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Account not found or already activated.' });
    }

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const setStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password = $1, status = 'coordinator_approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'student' AND status IN ('pending', 'coordinator_approved')
       RETURNING id, email, first_name, last_name, student_id`,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json({ message: 'Password set successfully. Student can now log in.', student: result.rows[0] });
  } catch (err) {
    console.error('Set student password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  upload,
  uploadStudentsExcel,
  uploadTeachersExcel,
  uploadSupervisorsExcel,
  getStudents,
  getStudentById,
  approveStudent,
  disapproveStudent,
  deleteStudent,
  setPassword,
  setStudentPassword,
};
