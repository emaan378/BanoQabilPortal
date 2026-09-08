const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Resolve backend-relative file paths (e.g. /uploads/documents/x.pdf) to a
// fully-qualified URL pointing at the backend server.
export function resolveFileUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getToken() {
  return localStorage.getItem('bq_token');
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('bq_user') || 'null');
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  localStorage.setItem('bq_token', token);
  localStorage.setItem('bq_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers || {}) }
    : { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || 'Request failed');
    error.status = response.status;
    error.details = body.errors || [];
    throw error;
  }

  return body;
}

export const authApi = {
login: (identifier, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, email: identifier, password }),
  }),
};

export const registrationApi = {
  list: ({ search = '', stage = '', course = '', page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (stage) params.set('stage', stage);
    if (course) params.set('course', course);
    return request(`/registrations?${params.toString()}`);
  },

  get: (id) => request(`/registrations/${id}`),

  create: (data) => request('/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/registrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  advanceStage: (id, stage) => request(`/registrations/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  }),

  scheduleTest: (id, scheduledAt) => request(`/registrations/${id}/test`, {
    method: 'POST',
    body: JSON.stringify({ scheduledAt }),
  }),

  recordTestResult: (id, score, result) => request(`/registrations/${id}/test/result`, {
    method: 'PUT',
    body: JSON.stringify({ score, result }),
  }),

  scheduleInterview: (id, scheduledAt) => request(`/registrations/${id}/interview`, {
    method: 'POST',
    body: JSON.stringify({ scheduledAt }),
  }),

  updateInterview: (id, data) => request(`/registrations/${id}/interview`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const testApi = {
  list: ({ status = '', search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return request(`/tests?${params.toString()}`);
  },

  get: (id) => request(`/tests/${id}`),

  schedule: (id, data) => request(`/tests/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  recordResult: (id, score, result) => request(`/tests/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify({ score, result }),
  }),
};

export const interviewApi = {
  list: ({ status = '', search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return request(`/interviews?${params.toString()}`);
  },

  get: (id) => request(`/interviews/${id}`),

  schedule: (id, data) => request(`/interviews/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  recordResult: (id, result, remarks) => request(`/interviews/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify({ result, remarks }),
  }),
};

export const studentApi = {
  list: ({ search = '', stage = '', course = '', batch = '', batchAllocationStatus = '', feeStatus = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (stage) params.set('stage', stage);
    if (course) params.set('course', course);
    if (batch) params.set('batch', batch);
    if (batchAllocationStatus) params.set('batchAllocationStatus', batchAllocationStatus);
    if (feeStatus) params.set('feeStatus', feeStatus);
    return request(`/students?${params.toString()}`);
  },

  get: (id) => request(`/students/${id}`),

  create: (data) => request('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  remove: (id) => request(`/students/${id}`, {
    method: 'DELETE',
  }),

  updateStatus: (id, data) => request(`/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  addDocument: (id, docType, fileName) => request(`/students/${id}/documents`, {
    method: 'POST',
    body: JSON.stringify({ docType, fileName }),
  }),

  updateDocumentStatus: (docId, status) => request(`/students/documents/${docId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  removeDocument: (docId) => request(`/students/documents/${docId}`, {
    method: 'DELETE',
  }),
};

export const teacherApi = {
  list: ({ search = '' } = {}) => request(`/teachers?${new URLSearchParams({ search }).toString()}`),

  get: (id) => request(`/teachers/${id}`),

  create: (data) => request('/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  remove: (id) => request(`/teachers/${id}`, {
    method: 'DELETE',
  }),

  documents: {
    add: (teacherId, docType, fileName) => request(`/teachers/${teacherId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ docType, fileName }),
    }),
    updateStatus: (docId, status) => request(`/teachers/documents/${docId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    remove: (docId) => request(`/teachers/documents/${docId}`, {
      method: 'DELETE',
    }),
  },
};

export const userApi = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
  create: (data) => request('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id) => request(`/users/${id}`, {
    method: 'DELETE',
  }),
};

const crud = (base, singular) => ({
  list: () => request(`/catalog/${base}`),
  get: (id) => request(`/catalog/${base}/${id}`),
  create: (data) => request(`/catalog/${base}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/catalog/${base}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id) => request(`/catalog/${base}/${id}`, {
    method: 'DELETE',
  }),
});

export const catalogApi = {
  overview: () => request('/catalog/overview'),
  seed: () => request('/catalog/seed', { method: 'POST' }),
  campuses: crud('campuses'),
  courses: crud('courses'),
  batches: crud('batches'),
  testimonials: crud('testimonials'),
  roster: (batchId) => request(`/catalog/batches/${batchId}/roster`),
  allocate: (batchId, studentIds) => request(`/catalog/batches/${batchId}/allocate`, {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  }),
};

export const contentApi = {
  courses: () => request('/public/courses'),
  campuses: () => request('/public/campuses'),
  testimonials: () => request('/public/testimonials'),
  register: (data) => request('/public/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const dashboardApi = {
  stats: () => request('/dashboard/stats'),
  resolveFlag: (id) => request(`/dashboard/flags/${id}/resolve`, { method: 'PATCH' }),
};

export const reportsApi = {
  overview: () => request('/reports/overview'),
};

export const financeApi = {
  list: ({ search = '', status = '', page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    return request(`/finance/vouchers?${params.toString()}`);
  },
  summary: () => request('/finance/summary'),
  create: (data) => request('/finance/vouchers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markPaid: (id) => request(`/finance/vouchers/${id}/paid`, {
    method: 'PATCH',
  }),
};


export const portalApi = {
  student: {
    dashboard: () => request('/portal/student/dashboard'),
    profile: () => request('/portal/student/me'),
    updateProfile: (data) => request('/portal/student/me', { method: 'PUT', body: JSON.stringify(data) }),
    attendance: (params = {}) => request(`/portal/student/attendance?${new URLSearchParams(params).toString()}`),
    assignments: () => request('/portal/student/assignments'),
    courses: () => request('/portal/student/courses'),
    submitAssignment: async (assignmentId, { file, link, note, fileName } = {}) => {
      const token = getToken();
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (link) formData.append('link', link);
      if (note) formData.append('note', note);
      if (fileName) formData.append('fileName', fileName);
      const response = await fetch(`${API_BASE_URL}/portal/student/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.message || 'Unable to submit assignment');
        error.status = response.status;
        error.details = body.errors || [];
        throw error;
      }
      return body;
    },
    fees: () => request('/portal/student/fees'),
    notices: () => request('/portal/student/notices'),
    addDocument: (data) => request('/portal/student/documents', { method: 'POST', body: JSON.stringify(data) }),
  },
  teacher: {
    dashboard: () => request('/portal/teacher/dashboard'),
    profile: () => request('/portal/teacher/me'),
    updateProfile: (data) => request('/portal/teacher/me', { method: 'PUT', body: JSON.stringify(data) }),
    batches: () => request('/portal/teacher/batches'),
    roster: (batchId) => request(`/portal/teacher/batches/${batchId}/roster`),
    attendance: (params = {}) => request(`/portal/teacher/attendance?${new URLSearchParams(params).toString()}`),
    saveAttendance: (data) => request('/portal/teacher/attendance', { method: 'PUT', body: JSON.stringify(data) }),
    assignments: () => request('/portal/teacher/assignments'),
    createAssignment: (data) => request('/portal/teacher/assignments', { method: 'POST', body: data }),
    updateAssignment: (assignmentId, data) => request(`/portal/teacher/assignments/${assignmentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    submissions: (assignmentId) => request(`/portal/teacher/assignments/${assignmentId}/submissions`),
    gradeSubmission: (submissionId, data) => request(`/portal/teacher/submissions/${submissionId}/grade`, { method: 'PATCH', body: JSON.stringify(data) }),
    gradebook: (batchId) => request(`/portal/teacher/gradebook?${new URLSearchParams({ batchId }).toString()}`),
    saveGrade: (data) => request('/portal/teacher/gradebook', { method: 'PUT', body: JSON.stringify(data) }),
    performance: (batchId) => request(`/portal/teacher/performance?${new URLSearchParams(batchId ? { batchId } : {}).toString()}`),
    notices: () => request('/portal/teacher/notices'),
    createNotice: (data) => request('/portal/teacher/notices', { method: 'POST', body: JSON.stringify(data) }),
    flags: () => request('/portal/teacher/flags'),
    createFlag: (data) => request('/portal/teacher/flags', { method: 'POST', body: JSON.stringify(data) }),
    resolveFlag: (flagId) => request(`/portal/teacher/flags/${flagId}/resolve`, { method: 'PATCH' }),
  },
};


export async function downloadFile(path) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Unable to download file');
  }
  return response.blob();
}

export async function uploadFile(path, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', body: formData, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'Unable to import spreadsheet');
    error.details = body.errors || [];
    throw error;
  }
  return body;
}

export const spreadsheetApi = {
  admin: {
    exportStudents: (search = '') => downloadFile(`/spreadsheets/students/export?${new URLSearchParams({ search }).toString()}`),
    importStudents: (file) => uploadFile('/spreadsheets/students/import', file),
    exportTeachers: (search = '') => downloadFile(`/spreadsheets/teachers/export?${new URLSearchParams({ search }).toString()}`),
    importTeachers: (file) => uploadFile('/spreadsheets/teachers/import', file),
  },
  student: {
    export: () => downloadFile('/portal/student/export'),
    import: (file) => uploadFile('/portal/student/import', file),
  },
  teacher: {
    export: () => downloadFile('/portal/teacher/export'),
    import: (file) => uploadFile('/portal/teacher/import', file),
  },
};

export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
