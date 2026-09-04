const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const testsRoutes = require('./routes/testsRoutes');
const interviewsRoutes = require('./routes/interviewsRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const publicRoutes = require('./routes/publicRoutes');
const financeRoutes = require('./routes/financeRoutes');
const { studentRouter: studentPortalRoutes, teacherRouter: teacherPortalRoutes } = require('./routes/portalRoutes');
const spreadsheetRoutes = require('./routes/spreadsheetRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Test Route
app.get('/', (req, res) => res.json({ success: true, message: 'Bano Qabil ERP API is running' }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/tests', testsRoutes);
app.use('/api/v1/interviews', interviewsRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/portal/student', studentPortalRoutes);
app.use('/api/v1/portal/teacher', teacherPortalRoutes);
app.use('/api/v1/spreadsheets', spreadsheetRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
