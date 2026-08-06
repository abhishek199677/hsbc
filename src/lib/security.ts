export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 254 && emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}
