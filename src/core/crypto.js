const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KDF_ITERATIONS = 100000;
const KDF_HASH = 'sha512';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 32;

/**
 * Derive a 256-bit key from a password using PBKDF2.
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, KDF_ITERATIONS, KEY_LENGTH, KDF_HASH);
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns an object with all crypto parameters needed for decryption.
 */
function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    algorithm: ALGORITHM,
    kdf: 'pbkdf2',
    kdfIterations: KDF_ITERATIONS,
    kdfHash: KDF_HASH,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext
  };
}

/**
 * Decrypt ciphertext with AES-256-GCM.
 * Throws on wrong password or tampered data.
 */
function decrypt(encryptedData, password) {
  const { salt, iv, authTag, ciphertext } = encryptedData;
  const key = deriveKey(password, Buffer.from(salt, 'base64'));

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

module.exports = { encrypt, decrypt };
