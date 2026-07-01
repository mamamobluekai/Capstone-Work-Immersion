const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const corsOptions = require('./config/corsOptions');
const authRoutes = require('./routes/auth.routes');
const refreshRoutes = require('./routes/refresh.routes');
const studentRoutes = require('./routes/student.routes');
const passwordRoutes = require('./routes/password.routes');
const userRoutes = require('./routes/user.routes');
const immersionRoutes = require('./routes/immersion.routes');
const deploymentRoutes = require('./routes/deployment.routes');
const requirementsRoutes = require('./routes/requirements.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/auth', refreshRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/immersion', immersionRoutes);
app.use('/api/deployment-requests', deploymentRoutes);
app.use('/api', requirementsRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

module.exports = app;
