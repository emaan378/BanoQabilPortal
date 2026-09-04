# Changes in this update

## Backend

**`Backend/routes/publicRoutes.js`**
- Added `GET /api/v1/public/campuses` — unauthenticated list of campuses (name, city, address) for the landing page.
- Added `POST /api/v1/public/registrations` — unauthenticated admissions form submission. Reuses the existing
  `validateCreateRegistration` validator and `registrationService.createRegistration`, so duplicate-CNIC (409)
  and validation (422) errors behave the same as the admin-side registration flow.

**`Backend/services/catalogService.js`**
- `listPublicCourses` now also returns each course's `campus`, so the front end can filter/display courses per campus.
- Added `listPublicCampuses`.

No changes to models, auth, or any existing admin-only route — all admin endpoints are untouched.

## Frontend

**`Frontend/src/lib/api.js`**
- `contentApi` gained `campuses()` and `register(data)`, pointing at the two new public endpoints.

**`Frontend/src/pages/LandingPage.jsx`**
- Removed the hardcoded `FALLBACK_COURSES` / `FALLBACK_TESTIMONIALS` mock arrays. Courses and testimonials now
  come only from the backend.
  - If there are no published courses yet, the Courses section shows an empty-state message instead of a blank grid.
  - If there are no active testimonials, the whole "Success Stories" section is hidden (instead of showing fake reviews).
- The "Quick Registration" form is now fully functional:
  - Controlled inputs for name, CNIC (auto-formatted as you type), phone, email.
  - New **Campus** dropdown, populated from `/public/campuses`.
  - **Preferred Course** dropdown is filtered to the selected campus's courses (disabled until a campus is chosen).
  - Client-side validation with inline field errors, a submitting/success/error state, and a real POST to
    `/public/registrations` on submit.
  - On success, the registration is saved with `stage: 'registered'` and the chosen `campus`/`course`, so it
    immediately shows up under **Admin → Campus Management → (that campus) → Students**, exactly like a
    registration entered by staff.
- Course cards now show a small campus tag (when the course has one) so visitors can see which campus offers it.

**`Frontend/src/pages/LandingPage.css`**
- Added styling for field-level error text, the success/error banner under the registration form, and the
  courses empty-state message.

## 2nd update

**Bug found: Finance & Voucher page couldn't link any student.**
"Generate Voucher" required typing an exact Roll Number, but nothing in the app ever assigns a Roll Number to
a student — so the lookup never matched, and no student (old or newly registered) could ever get a voucher.

- `Backend/validators/financeValidator.js` / `Backend/services/financeService.js` — `createVoucher` now accepts
  a `studentId` (the student's real database ID) as the primary way to link a voucher, falling back to
  `rollNumber` for backward compatibility if one is ever set.
- `Frontend/src/pages/admin/AdminFinance.jsx` — "Generate Voucher" now has a searchable **Student** picker
  (search by name/CNIC/registration ID, pick from the list) instead of a blind roll-number text box. Every
  student — including ones registered from the public landing page — can now get a voucher generated for them.

**Also fixed: `AdminTests.jsx` was swallowing the real validation error.**
When scheduling a test or recording a result failed, it only showed the generic "Validation failed" toast and
discarded the specific reason the backend sent back. It now shows the actual error detail, same as the other
admin pages.

## 3rd update — Admin login "does not have admin access"

This isn't a connectivity issue — the login itself succeeds (correct email/password), the frontend just
checks `role === 'admin'` after logging in, and this account's stored `role` isn't `"admin"`.

- **`Backend/models/User.js`** — fixed a real bug in the password pre-save hook: it was missing a `return`
  before `next()`, so if anything ever calls `.save()` on an *existing* user (not just on creation), it would
  re-hash the already-hashed password and permanently break that account's login. Nothing in the current app
  triggers this yet, but it was a landmine for any future "edit user" feature — worth having fixed regardless.
- **`Backend/scripts/fixAdminRole.js`** — new one-off script to force an account's role to `admin` directly in
  the database via `updateOne` (never touches the password). Run it from the `Backend` folder:
  ```
  node scripts/fixAdminRole.js admin@banoquabil.fsd
  ```
  (or replace with whichever email is failing). It'll print the account's current role and fix it in place.


- `Frontend/src/lib/campusContext.js` exists but isn't wired into anything (looks like scaffolding for a future
  feature) — left as-is since it wasn't part of the request.
- Admin-only routes/pages (`AdminCampus.jsx`, `AdminWebsite.jsx`, etc.) already worked correctly once real data
  exists; no changes were needed there.

## Testing this yourself
1. Start the backend (`cd Backend && npm install && npm run dev` or similar) and confirm `MONGO_URI` is set in `.env`.
2. Start the frontend (`cd Frontend && npm install && npm run dev`), confirm `VITE_API_URL` in `.env` points at the backend.
3. In Admin → Campus Management, add a campus and a course under it if you haven't already.
4. On the landing page, scroll to "Quick Registration", pick the campus you just added, pick a course, fill in the rest, and submit.
5. Go back to Admin → Campus Management → that campus → Students, and confirm the new registration is listed there.
