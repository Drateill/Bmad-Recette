import { hashPassword, comparePassword } from './password.util';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const plaintext = 'TestPassword123';
      const hashed = await hashPassword(plaintext);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plaintext);
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const plaintext = 'TestPassword123';
      const hash1 = await hashPassword(plaintext);
      const hash2 = await hashPassword(plaintext);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should handle minimum length passwords', async () => {
      const plaintext = 'Test123!';
      const hashed = await hashPassword(plaintext);

      expect(hashed).toBeDefined();
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const plaintext = 'TestPassword123';
      const hashed = await hashPassword(plaintext);
      const result = await comparePassword(plaintext, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const plaintext = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashed = await hashPassword(plaintext);
      const result = await comparePassword(wrongPassword, hashed);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const plaintext = 'TestPassword123';
      const hashed = await hashPassword(plaintext);
      const result = await comparePassword('', hashed);

      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const plaintext = 'TestPassword123';
      const hashed = await hashPassword(plaintext);
      const result = await comparePassword('testpassword123', hashed);

      expect(result).toBe(false);
    });
  });
});
