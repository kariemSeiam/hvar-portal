/** Match backend normalize_jwt_role — admin menu / route guards. */
export function isAdminRole(role) {
  return String(role ?? '')
    .trim()
    .toLowerCase() === 'admin';
}
