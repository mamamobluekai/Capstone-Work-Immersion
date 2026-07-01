const pool = require('../db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { getLoginAttempts, incrementLoginAttempts, resetLoginAttempts, isAccountLocked, LOCK_TIME_MINUTES } = require('../utils/loginAttempts');

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      student_id,
      grade_level,
      strand,
      employee_id,
      department,
      company_name,
      designation,
      phone,
    } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (
        email, password, first_name, last_name, role,
        student_id, grade_level, strand,
        employee_id, department,
        company_name, designation,
        phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, first_name, last_name, role, status`,
      [
        email, hashedPassword, first_name, last_name, role,
        student_id || null, grade_level || null, strand || null,
        employee_id || null, department || null,
        company_name || null, designation || null,
        phone || null, 'pending'
      ]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({ user, accessToken, refreshToken, message: 'Registration successful. Your account is pending approval.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const attempts = await getLoginAttempts(email, ipAddress);
    if (isAccountLocked(attempts)) {
      return res.status(429).json({ error: `Account temporarily locked due to too many failed password attempts. Try again in ${LOCK_TIME_MINUTES} minutes.` });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      await incrementLoginAttempts(email, ipAddress);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const attemptInfo = await incrementLoginAttempts(email, ipAddress);
      if (attemptInfo.lockedUntil) {
        return res.status(429).json({ error: `Account temporarily locked due to too many failed password attempts. Try again in ${LOCK_TIME_MINUTES} minutes.` });
      }
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval. Please wait for an admin or coordinator to approve your account.' });
    }

    if (user.status === 'disapproved') {
      return res.status(403).json({ error: 'Account has been disapproved. Please contact support.' });
    }

    if (user.status !== 'approved' && user.status !== 'coordinator_approved') {
      return res.status(403).json({ error: 'Account not activated. Please contact support.' });
    }

    await resetLoginAttempts(email, ipAddress);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully.' });
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided.' });
  }

  try {
    const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
    const decoded = verifyRefreshToken(refreshToken);

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval.' });
    }

    if (user.status === 'disapproved') {
      return res.status(403).json({ error: 'Account has been disapproved.' });
    }

    if (user.status !== 'approved' && user.status !== 'coordinator_approved') {
      return res.status(403).json({ error: 'Account not activated.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

module.exports = { register, login, logout, refreshToken };
