const KEY = 'bq_student_context';
const RETURN_KEY = 'bq_student_return_page';

export function setStudentContext(studentId, returnPage) {
  try {
    sessionStorage.setItem(KEY, studentId);
    if (returnPage) sessionStorage.setItem(RETURN_KEY, returnPage);
  } catch {}
}

export function peekStudentContext() {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function peekReturnPage(fallback) {
  try {
    return sessionStorage.getItem(RETURN_KEY) || fallback;
  } catch {
    return fallback;
  }
}