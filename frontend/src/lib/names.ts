/** "Prof. Meera Iyer" -> "Meera", "Aarav Mehta" -> "Aarav". */
export function firstName(fullName: string): string {
  const withoutTitle = fullName.replace(/^(prof\.?|dr\.?)\s+/i, '').trim();
  return withoutTitle.split(/\s+/)[0] ?? fullName;
}
