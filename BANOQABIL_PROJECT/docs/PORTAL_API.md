# Bano Qabil Portal API

The portal API is mounted under `/api/v1/portal` and follows the existing Express MVC structure:

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routes | `Backend/routes/portalRoutes.js` | Role-protected endpoint definitions |
| Controllers | `Backend/controllers/portalController.js` | Request validation, response envelopes, and error translation |
| Services | `Backend/services/studentPortalService.js` and `Backend/services/teacherPortalService.js` | Domain rules, ownership checks, and persistence orchestration |
| Models | `Backend/models/{Attendance,Assignment,AssignmentSubmission,Grade,Notice}.js` | MongoDB persistence schemas |

All protected requests require `Authorization: Bearer <jwt>`.

## Student portal

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/portal/student/dashboard` | Aggregated profile, batch, attendance, assignments, grades, fees, and notices |
| `GET` | `/api/v1/portal/student/me` | Student profile with uploaded documents |
| `PUT` | `/api/v1/portal/student/me` | Update editable contact and guardian fields |
| `GET` | `/api/v1/portal/student/attendance` | Attendance records and rate summary; accepts `from` and `to` |
| `GET` | `/api/v1/portal/student/assignments` | Published assignments for the student’s batch with submission state |
| `POST` | `/api/v1/portal/student/assignments/:assignmentId/submissions` | Submit a file reference, link, or note |
| `GET` | `/api/v1/portal/student/fees` | Fee vouchers with paid, unpaid, and overdue display status |
| `GET` | `/api/v1/portal/student/notices` | Student-facing announcements for the student’s batch |
| `POST` | `/api/v1/portal/student/documents` | Add a document metadata record for later file-storage integration |

Student accounts can authenticate with email, roll number, registration ID, or CNIC. The account email must match the student registration email for self-service ownership checks.

## Teacher portal

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/portal/teacher/dashboard` | Assigned batches, enrolment counts, classroom stats, assignments, and notices |
| `GET` | `/api/v1/portal/teacher/me` | Teacher profile |
| `PUT` | `/api/v1/portal/teacher/me` | Update teacher profile fields |
| `GET` | `/api/v1/portal/teacher/batches` | Assigned batches |
| `GET` | `/api/v1/portal/teacher/batches/:batchId/roster` | Batch roster |
| `GET` | `/api/v1/portal/teacher/attendance` | Attendance records for a batch/date; requires `batchId` and optionally `date` |
| `PUT` | `/api/v1/portal/teacher/attendance` | Upsert attendance records for an assigned batch |
| `GET` | `/api/v1/portal/teacher/assignments` | Teacher assignments and pending submission counts |
| `POST` | `/api/v1/portal/teacher/assignments` | Publish an assignment for an assigned batch |
| `PATCH` | `/api/v1/portal/teacher/assignments/:assignmentId` | Update an owned assignment |
| `GET` | `/api/v1/portal/teacher/assignments/:assignmentId/submissions` | Review submissions for an owned assignment |
| `PATCH` | `/api/v1/portal/teacher/submissions/:submissionId/grade` | Grade a submission and save feedback |
| `GET` | `/api/v1/portal/teacher/gradebook` | Batch gradebook; requires `batchId` |
| `PUT` | `/api/v1/portal/teacher/gradebook` | Upsert a student assessment score |
| `GET` | `/api/v1/portal/teacher/notices` | Teacher announcements |
| `POST` | `/api/v1/portal/teacher/notices` | Publish a batch or teacher-facing announcement |

## Response envelope

Successful responses use the following shape:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Validation and authorization failures return `success: false` with a human-readable `message`; validation failures may also include an `errors` array.

## Local verification

From `Backend`, run `node scripts/smokePortal.js` to load all portal models, services, controllers, and routes. From `Frontend`, run `npm run build` to create the production bundle.


## Spreadsheet import and export

Admin spreadsheet endpoints are available under `/api/v1/spreadsheets`:

| Method | Endpoint | Workbook behavior |
| --- | --- | --- |
| `GET` | `/students/export?search=` | Downloads the filtered student list as `bano-qabil-students.xlsx` |
| `POST` | `/students/import` | Imports the first worksheet from a multipart field named `file`; matches by Mongo ID, Student ID, or CNIC and creates or updates records |
| `GET` | `/teachers/export?search=` | Downloads the filtered teacher list as `bano-qabil-teachers.xlsx` |
| `POST` | `/teachers/import` | Imports the first worksheet from `file`; matches by Mongo ID, Teacher ID, or email and creates or updates records |

Student portal endpoints are `/api/v1/portal/student/export` and `/api/v1/portal/student/import`. Student exports contain Profile, Attendance, Assignments, Grades, and Fees worksheets. Student import reads the Profile worksheet and updates editable personal and guardian fields.

Teacher portal endpoints are `/api/v1/portal/teacher/export` and `/api/v1/portal/teacher/import`. Teacher exports contain Profile, Batches, Roster, Assignments, Gradebook, and Attendance worksheets. Teacher import reads the Gradebook worksheet and upserts scores only for the authenticated teacher’s assigned batches.

Admin list search accepts Student ID/registration ID, roll number, CNIC, name, email, phone, or MongoDB ID for students. Teacher search accepts Teacher ID, name, email, phone, specialization, or MongoDB ID. New teachers receive IDs such as `TCH-0001`; existing teachers without a stored friendly ID remain searchable and exportable through their MongoDB ID.

Required student import columns are `Name`, `CNIC`, `Phone`, and `Course`. Required teacher import columns are `Name`, `Phone`, and `Specialization`. Import responses report `created`, `updated`, `skipped`, and row-level `errors` where applicable.
