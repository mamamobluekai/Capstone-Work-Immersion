const pool = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sentReports = [];

const buildSummaryPayload = async () => {
  const client = await pool.connect();
  try {
    const [studentsRes, requirementsRes, deploymentRes, pendingRequestsRes] = await Promise.all([
      client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' OR status = 'coordinator_approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'disapproved' THEN 1 END) as disapproved
        FROM users WHERE role = 'student'
      `),
      client.query(`
        SELECT 
          COUNT(*) as total_requirements,
          COUNT(CASE WHEN srs.status IN ('Approved', 'Verified') THEN 1 END) as submitted,
          COUNT(CASE WHEN srs.status IN ('Pending Review', 'Pending', 'Needs Revision') THEN 1 END) as pending
        FROM student_requirement_submissions srs
      `),
      client.query(`
        SELECT COUNT(*) as deployed
        FROM deployment_requests dr
        WHERE dr.status = 'approved'
      `),
      client.query(`
        SELECT COUNT(*) as pending_requests
        FROM deployment_requests
        WHERE status = 'pending'
      `),
    ]);

    const stats = studentsRes.rows[0];
    const reqStats = requirementsRes.rows[0];
    const deployStats = deploymentRes.rows[0];
    const pendingReqStats = pendingRequestsRes.rows[0];

    const totalStudents = parseInt(stats.total) || 0;
    const pendingStudents = parseInt(stats.pending) || 0;
    const approvedStudents = parseInt(stats.approved) || 0;
    const disapprovedStudents = parseInt(stats.disapproved) || 0;

    const totalRequirements = parseInt(reqStats.total_requirements) || 0;
    const submittedRequirements = parseInt(reqStats.submitted) || 0;
    const pendingRequirements = parseInt(reqStats.pending) || 0;

    const deployedStudents = parseInt(deployStats.deployed) || 0;
    const pendingDeploymentRequests = parseInt(pendingReqStats.pending_requests) || 0;

    const approvalRate = totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0;
    const pendingRate = totalStudents > 0 ? Math.round((pendingStudents / totalStudents) * 100) : 0;
    const disapprovalRate = totalStudents > 0 ? Math.round((disapprovedStudents / totalStudents) * 100) : 0;
    const requirementsCompletionRate = totalRequirements > 0 ? Math.round((submittedRequirements / totalRequirements) * 100) : 0;

    const flaggedIssues = [];
    if (pendingRequirements > 0) {
      flaggedIssues.push(`${pendingRequirements} students have pending requirements`);
    }
    if (pendingStudents > 0) {
      flaggedIssues.push(`${pendingStudents} students are pending approval`);
    }
    if (pendingDeploymentRequests > 0) {
      flaggedIssues.push(`${pendingDeploymentRequests} deployment requests pending`);
    }

    return {
      total_students: totalStudents,
      pending_students: pendingStudents,
      approved_students: approvedStudents,
      disapproved_students: disapprovedStudents,
      approval_rate: approvalRate,
      pending_rate: pendingRate,
      disapproval_rate: disapprovalRate,
      requirements_completion_rate: requirementsCompletionRate,
      deployed_students: deployedStudents,
      pending_deployment_requests: pendingDeploymentRequests,
      flagged_issues: flaggedIssues,
    };
  } finally {
    client.release();
  }
};

const getSummaryReport = async (req, res) => {
  try {
    const summary = await buildSummaryPayload();
    res.json({ summary });
  } catch (err) {
    console.error('getSummaryReport error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getReports = async (req, res) => {
  try {
    res.json({ reports: sentReports.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

const sendReportToAdmin = async (req, res) => {
  try {
    const { recipient_email, title, message } = req.body;

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    const summary = await buildSummaryPayload();
    const approvalRate = summary.approval_rate;
    const pendingRate = summary.pending_rate;
    const disapprovalRate = summary.disapproval_rate;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2a5298;">${title || 'Work Immersion Summary Report'}</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        ${message ? `<p>${message}</p>` : ''}
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Metric</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Value</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Total Students</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${summary.total_students}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Pending</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${summary.pending_students} (${pendingRate}%)</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Approved</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${summary.approved_students} (${approvalRate}%)</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Disapproved</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${summary.disapproved_students} (${disapprovalRate}%)</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 12px;">Marinduque National High School - Work Immersion Office</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
      to: recipient_email,
      subject: title || 'Work Immersion Summary Report',
      html: htmlContent,
    });

    const report = {
      id: `${Date.now()}`,
      title: title || 'Work Immersion Summary Report',
      recipient_email,
      message: message || '',
      summary,
      created_at: new Date().toISOString(),
      status: 'sent',
    };

    sentReports.unshift(report);

    res.json({ message: 'Report sent successfully.', report });
  } catch (err) {
    console.error('sendReportToAdmin error:', err);
    res.status(500).json({ error: 'Failed to send report.' });
  }
};

module.exports = {
  getSummaryReport,
  getReports,
  sendReportToAdmin,
};