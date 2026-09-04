# Merge Notes — BanoQabil_project + banoQabil

This project (`BanoQabil project`) is the merged result of your two uploads.
Project1 (`BanoQabil project`) was kept as the base; working/functional pieces
from Project2 (`banoQabil`) were merged in on top. Below is exactly what
changed and why, so nothing is a surprise.

## Why the backend was swapped in from Project2

Investigation showed Project1's own Frontend (`lib/api.js`, and most of the
`pages/admin/*` files) was **already written to call** a REST API shaped like
`/api/v1/catalog/...`, `/api/v1/registrations/...`, `/api/v1/tests/...`,
`/api/v1/interviews/...`, `/api/v1/reports/...`, `/api/v1/public/...` — but
Project1's own Backend only implemented the old shape
(`/api/v1/campuses`, `/api/v1/courses`, `/api/v1/batches`,
`/api/v1/entry-tests`, plain `/api/v1/interviews`), and several Project1
admin pages (Campus, Batches, Tests, Interviews, Registrations, Students,
Teachers, Reports, Dashboard) were still running on **mock data**, not real
API calls. Project1's `teacherController.js` and `config/permissions.js`
were also dead code — never wired into `app.js` at all.

Project2 turned out to be the completed, working version of the **same**
application: same tech stack, same component library, same `api.js`
contract — just with the backend actually built out (controllers, a
services/validators layer, and matching models) and the admin pages wired
to real API calls instead of mock arrays.

So: **every API now actually works**, because the backend routes now match
what the frontend has been calling all along.

## What was removed (superseded, to avoid duplicate/dead code)

- `Backend/controllers/{batchController,campusController,courseController,entrytestController,interviewController,teacherController}.js`
- `Backend/routes/{batchRoutes,campusRoutes,courseRoutes,entrytestRoutes,interviewRoutes}.js`
- `Backend/models/{Entrytest,Interview}.js`
- `Backend/config/permissions.js` (was an incomplete/broken stub, unused)

These were replaced by the equivalent, working functionality in
`catalogController` (campuses/courses/batches/teachers), `testsController`,
`interviewsController`, and the `Registration` model's embedded
`test`/`interview` sub-documents.

## What was added from Project2

- **New feature — Website Content admin page**: `AdminWebsite.jsx/.css`,
  wired to `Backend/routes/publicRoutes.js` + `models/Testimonial.js`, so
  admins can manage testimonials/content shown on the public site. Added to
  the sidebar nav and router (`App.jsx`, `types.js`, `AdminLayout.jsx`).
- **Backend architecture**: `services/`, `validators/`, `utils/lifecycle.js`,
  and the new controllers/routes listed above.
- **New models**: `Teacher.js`, `Testimonial.js`, `Counter.js`, `Document.js`.
- **Admin login — changed as requested**: `AdminLogin.jsx`/`.css` now use the
  new split-screen `LoginShell` design, call `authApi.login()` from
  `lib/api.js`, and store the session via `setAuthSession()`/
  `clearAuthSession()` (the old version left the token in `localStorage`
  after "logging out" — now fixed). Same change applied consistently to
  `TeacherLogin.jsx` and `StudentLogin.jsx` for a uniform login flow.
- Working, API-integrated versions of: `AdminCampus`, `AdminBatches`,
  `AdminTests`, `AdminInterviews`, `AdminRegistrations`, `AdminStudents`,
  `AdminTeachers`, `AdminStudentProfile`, `AdminReports`, `AdminDashboard`,
  `LandingPage` (previously mock-data only).
- `Frontend/.env.example`, `db.js` DNS fix (`dns.setDefaultResultOrder`,
  Google DNS servers — improves MongoDB Atlas connection reliability on some
  networks).

## What was kept from Project1 (retained, as requested)

- Your own `.env` (Mongo URI, JWT secret, port) — **not** switched to
  Project2's.
- All uploaded files in `Backend/public/uploads/documents/`.
- `Backend/config/multer.js` — kept in place though currently unused (the
  new document-tracking model stores a filename reference rather than doing
  a multipart upload, matching how Project2's frontend calls
  `studentApi.addDocument(id, docType, fileName)`). If you want real file
  uploads wired back in, this is the file to reconnect.
- `Frontend/src/services/teacherService.js` — this was already dead/unused
  code in Project1 (never imported anywhere, targets an endpoint that never
  existed in either backend). Kept in the tree per "retain everything," not
  wired up.
- `AdminAcademics`, `AdminFinance`, `AdminDocuments` pages — identical in
  both projects, still on mock data, untouched.
- Everything else that didn't differ between the two projects.

## Follow-up fixes (after first delivery)

- **Removed the duplicate top navbar** on admin pages. The desktop layout
  had a second "Admin ERP" bar rendered above the page content
  (`AdminLayout.jsx`'s `<header>`), duplicating the same branding already
  shown in the sidebar. It's now hidden on desktop (≥1024px) — only the
  mobile hamburger button remains, and only shows on small screens.
- **Removed the "Send Reminders" banner** from Finance & Vouchers — it was
  a non-functional placeholder (just showed a toast, no SMS/WhatsApp
  integration exists anywhere in the codebase).
- **Finance & Vouchers is now fully functional**, backed by a real API
  instead of `mockData.js`:
  - New `Voucher` model, `financeService.js`, `financeController.js`,
    `financeValidator.js`, `financeRoutes.js`, mounted at `/api/v1/finance`.
  - `GET /finance/vouchers` (search + status filter), `GET /finance/summary`
    (total collected / outstanding / overdue count), `POST /finance/vouchers`
    (generate — looks up the student by roll number against `Registration`
    if it matches), `PATCH /finance/vouchers/:id/paid` (mark paid).
  - "Overdue" is derived automatically (unpaid + past due date) rather than
    being a status you set by hand.
  - `financeApi` added to `lib/api.js`; `AdminFinance.jsx` now fetches real
    data with loading/empty states, same as the other admin pages.

## Before you run it

- `node_modules/` was **not** included in this delivery (kept the zip
  small and clean). Run `npm install` inside both `Backend/` and
  `Frontend/` before starting.
- Backend dependencies now include both `multer` (retained) and `nodemon`
  (needed by the `npm start` script, was missing from Project1's
  `package.json` despite being referenced).
- I booted the merged backend locally and confirmed the whole server starts
  and every route mounts without errors; I couldn't reach your actual
  MongoDB Atlas cluster from this sandbox to test live data, so please
  do a normal smoke test after `npm install && npm start`.
