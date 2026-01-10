import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt
 * @param plainText - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a bcrypt hash
 * @param plainText - The plaintext password to compare
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function comparePassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}
