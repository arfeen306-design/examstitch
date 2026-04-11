/**
 * Single definition of “platform admin” role on student_accounts.
 * DB values may vary in casing; login and RBAC must agree.
 */
export function isStudentAccountAdminRole(role: string | null | undefined): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}
