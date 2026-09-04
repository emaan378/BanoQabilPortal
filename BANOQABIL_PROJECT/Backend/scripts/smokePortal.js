const modules = [
  '../models/Attendance',
  '../models/Assignment',
  '../models/AssignmentSubmission',
  '../models/Grade',
  '../models/Notice',
  '../services/studentPortalService',
  '../services/teacherPortalService',
  '../controllers/portalController',
  '../routes/portalRoutes',
];

for (const modulePath of modules) {
  require(modulePath);
  console.log(`loaded ${modulePath}`);
}

console.log('portal module smoke test passed');
