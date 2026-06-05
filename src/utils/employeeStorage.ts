// Helpers for safely persisting the logged-in employee in localStorage.
// We must NOT keep secrets (password) in the browser storage.

const SENSITIVE_KEYS = ['password', 'pass', 'password_hash'];

/** Returns a shallow copy of the employee object without sensitive fields. */
export function sanitizeEmployeeForStorage<T extends Record<string, any>>(employee: T): Partial<T> {
  if (!employee || typeof employee !== 'object') return employee;
  const safe: Record<string, any> = { ...employee };
  for (const key of SENSITIVE_KEYS) {
    if (key in safe) delete safe[key];
  }
  return safe as Partial<T>;
}

/** Persist the current employee in localStorage with secrets stripped out. */
export function storeCurrentEmployee(employee: Record<string, any>): void {
  try {
    localStorage.setItem('current_employee', JSON.stringify(sanitizeEmployeeForStorage(employee)));
  } catch {
    // ignore quota / serialization errors
  }
}
