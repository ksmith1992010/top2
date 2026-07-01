/**
 * Check whether a permission list grants the required permission.
 * Format: `resource:action` or `resource:*`. Admin uses `*`.
 */
export function hasPermission(permissions: readonly string[], required: string): boolean {
  if (permissions.includes("*")) {
    return true;
  }

  const [resource, action] = required.split(":");
  if (!resource || !action) {
    return false;
  }

  if (permissions.includes(`${resource}:*`)) {
    return true;
  }

  return permissions.includes(required);
}
