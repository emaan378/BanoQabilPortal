// Base URL of the backend API. Set VITE_API_URL in a .env file at the
// Frontend root if your backend runs somewhere other than localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

// GET /api/v1/teachers
export async function fetchTeachers() {
  const res = await fetch(`${API_BASE_URL}/teachers`);
  const data = await handleResponse(res);
  return data.teachers;
}

// POST /api/v1/teachers
export async function createTeacherApi(payload) {
  const res = await fetch(`${API_BASE_URL}/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.teacher;
}

// PUT /api/v1/teachers/:id
export async function updateTeacherApi(id, payload) {
  const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.teacher;
}

// DELETE /api/v1/teachers/:id
export async function deleteTeacherApi(id) {
  const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

// GET /api/v1/teachers/:id/documents
export async function fetchTeacherDocuments(teacherId) {
  const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}/documents`);
  const data = await handleResponse(res);
  return data.documents;
}

// POST /api/v1/teachers/:id/documents  (multipart/form-data — actual file upload)
export async function uploadTeacherDocumentApi(teacherId, { docType, file }) {
  const formData = new FormData();
  formData.append('docType', docType);
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}/documents`, {
    method: 'POST',
    body: formData, // don't set Content-Type manually — browser sets the multipart boundary
  });
  const data = await handleResponse(res);
  return data.document;
}

// PUT /api/v1/teachers/:id/documents/:docId
export async function updateTeacherDocumentStatusApi(teacherId, docId, status) {
  const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}/documents/${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse(res);
  return data.document;
}

// DELETE /api/v1/teachers/:id/documents/:docId
export async function deleteTeacherDocumentApi(teacherId, docId) {
  const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}/documents/${docId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

// Builds a full URL to view/download an uploaded file
export function getTeacherDocumentFileUrl(filePath) {
  const serverOrigin = API_BASE_URL.replace(/\/api\/v1$/, '');
  return `${serverOrigin}/uploads/${filePath}`;
}