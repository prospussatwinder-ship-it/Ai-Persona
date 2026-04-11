export function can(
  permissions: string[] | undefined,
  slug: string
): boolean {
  return !!permissions?.includes(slug);
}
