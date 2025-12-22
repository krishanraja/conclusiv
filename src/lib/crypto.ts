/**
 * Secure password hashing utilities using Web Crypto API
 * 
 * Note: For share passwords, we use SHA-256 with a random salt.
 * This is simpler than bcrypt but suitable for low-stakes share passwords.
 * For user authentication passwords, rely on Supabase Auth which uses bcrypt.
 */

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with SHA-256 and a salt
 * Returns format: salt:hash
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const useSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(useSalt + password);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${useSalt}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * Performs constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const [salt, expectedHash] = parts;
  const computedHashWithSalt = await hashPassword(password, salt);
  const computedHash = computedHashWithSalt.split(':')[1];
  
  // Constant-time comparison
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if a stored password is in the new hashed format (contains salt:hash)
 */
export function isHashedPassword(storedPassword: string): boolean {
  const parts = storedPassword.split(':');
  // Hashed format is "salt:hash" where salt is 32 hex chars and hash is 64 hex chars
  return parts.length === 2 && parts[0].length === 32 && parts[1].length === 64;
}

