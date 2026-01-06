export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
