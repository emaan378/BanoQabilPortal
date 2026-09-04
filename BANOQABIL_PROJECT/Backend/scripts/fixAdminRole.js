/**
 * One-off fix: force a user's role to 'admin'.
 *
 * Usage (from the Backend folder, with your .env / MONGO_URI in place):
 *   node scripts/fixAdminRole.js admin@banoquabil.fsd
 *
 * If no email is passed, it defaults to admin@banoquabil.fsd
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const email = process.argv[2] || 'admin@banoquabil.fsd';

const run = async () => {
  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    console.log(`No user found with email "${email}".`);
    console.log('Register one first via POST /api/v1/auth/register with { name, email, password, role: "admin" }.');
    process.exit(0);
  }

  console.log(`Found user: ${user.name} <${user.email}> — current role: "${user.role}"`);

  if (user.role === 'admin') {
    console.log('This account already has the admin role. If login is still failing, double-check the email/password you are typing.');
    process.exit(0);
  }

  // Use updateOne (not .save()) so the password hash is never touched — only the role field changes.
  await User.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
  console.log(`Updated role to "admin" for ${email}.`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to fix admin role:', error.message);
  process.exit(1);
});
