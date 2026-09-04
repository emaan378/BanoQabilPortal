/**
 * Seed a default admin user so the Admin Portal login can be tested.
 *
 * Usage (from the Backend folder, with your .env / MONGO_URI in place):
 *   node scripts/seedAdmin.js
 *
 * Optional overrides:
 *   node scripts/seedAdmin.js you@example.com yourPassword "Your Name"
 *
 * Default login created:
 *   email:    admin@banoquabil.fsd
 *   password: Admin@123
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const email = process.argv[2] || 'admin@banoquabil.fsd';
const password = process.argv[3] || 'Admin@123';
const name = process.argv[4] || 'Super Admin';

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`A user with email "${email}" already exists (role: "${existing.role}").`);
    console.log('Nothing changed. Delete that user first if you want to reseed, or use scripts/fixAdminRole.js to fix the role.');
    process.exit(0);
  }

  // .create() runs the pre('save') hook, so the password gets hashed automatically.
  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
  });

  console.log('Admin user created successfully:');
  console.log(`  Name:     ${admin.name}`);
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${password}  (plain text shown once — it is hashed in the database)`);
  console.log(`  Role:     ${admin.role}`);
  console.log('\nYou can now log in at the Admin Portal with the email and password above.');
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed admin:', error.message);
  process.exit(1);
});
