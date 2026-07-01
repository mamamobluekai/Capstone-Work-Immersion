const pool = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('Email transporter verification failed:', err.message);
  } else {
    console.log('Email transporter ready.');
  }
});

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, student_id, employee_id, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getCoordinators = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, department, created_at
       FROM users
       WHERE role IN ('coordinator', 'admin') AND status IN ('approved', 'coordinator_approved')
       ORDER BY first_name, last_name`
    );
    res.json({ coordinators: result.rows });
  } catch (err) {
    console.error('Get coordinators error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getUsersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, status, student_id, employee_id, created_at
       FROM users WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users by status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'coordinator_approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending' AND role IN ('teacher', 'supervisor')
       RETURNING id, email, first_name, last_name, role`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found, already processed, or not a teacher/supervisor.' });
    }

    const user = result.rows[0];
    const roleLabel = user.role === 'teacher' ? 'Teacher' : 'Supervisor';

    try {
      await transporter.sendMail({
        from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Your Work Immersion ${roleLabel} Account is Approved`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2a5298;">Account Approved</h2>
            <p>Hello <strong>${user.first_name} ${user.last_name}</strong>,</p>
            <p>Your ${roleLabel} account has been approved by the coordinator. You can now log in to the Work Immersion Management System.</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 20px 0;">
              <a href="${getClientUrl()}/login" style="background: #2a5298; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Log In
              </a>
            </p>
            <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
          </div>
        `,
      });
      console.log(`Approval email sent to ${user.email}`);
    } catch (emailErr) {
      console.error(`Failed to send approval email to ${user.email}:`, emailErr.message);
    }

    res.json({ message: 'User approved.', user });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const disapproveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'disapproved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending' AND role IN ('teacher', 'supervisor')
       RETURNING id, email, first_name, last_name, role`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found, already processed, or not a teacher/supervisor.' });
    }
    res.json({ message: 'User disapproved.', user: result.rows[0] });
  } catch (err) {
    console.error('Disapprove user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const approveCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending' AND role = 'coordinator'
       RETURNING id, email, first_name, last_name, role`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinator not found, already processed, or not a coordinator.' });
    }

    const user = result.rows[0];

    await transporter.sendMail({
      from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Work Immersion Coordinator Account is Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a5298;">Account Approved</h2>
          <p>Hello <strong>${user.first_name} ${user.last_name}</strong>,</p>
          <p>Your Coordinator account has been approved by the admin. You can now log in to the Work Immersion Management System.</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 20px 0;">
            <a href="${getClientUrl()}/login" style="background: #2a5298; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Log In
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
        </div>
      `,
    });

    res.json({ message: 'Coordinator approved.', user: result.rows[0] });
  } catch (err) {
    console.error('Approve coordinator error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const disapproveCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET status = 'disapproved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending' AND role = 'coordinator'
       RETURNING id, email, first_name, last_name, role`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinator not found, already processed, or not a coordinator.' });
    }
    res.json({ message: 'Coordinator disapproved.', user: result.rows[0] });
  } catch (err) {
    console.error('Disapprove coordinator error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM teacher_batch_students WHERE student_id = $1', [id]);
      await client.query('DELETE FROM teacher_batches WHERE coordinator_id = $1 OR teacher_id = $1', [id]);
      await client.query('DELETE FROM student_documents WHERE student_id = $1', [id]);
      await client.query('DELETE FROM student_requirement_submissions WHERE student_id = $1 OR user_id = $1 OR reviewed_by = $1', [id]);
      await client.query('DELETE FROM submission_logs WHERE actor_id = $1', [id]);
      await client.query('DELETE FROM students WHERE user_id = $1', [id]);
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found.' });
      }
      await client.query('COMMIT');
      res.json({ message: 'User deleted.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getAllUsers,
  getCoordinators,
  getUsersByStatus,
  approveUser,
  disapproveUser,
  approveCoordinator,
  disapproveCoordinator,
  deleteUser,
};
