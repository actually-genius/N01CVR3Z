const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt } = require('./crypto');

/**
 * Get (and create if needed) the directory where diary entries are stored.
 */
function getEntriesDir() {
  const dir = path.join(app.getPath('userData'), 'entries');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get the full file path for a diary entry by ID.
 */
function getEntryPath(id) {
  return path.join(getEntriesDir(), `${id}.diary`);
}

/**
 * Create a new encrypted diary entry.
 * Returns metadata (id, createdAt, hint) — never returns plaintext.
 */
function createEntry(text, password, hint) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const encrypted = encrypt(text, password);

  const entry = {
    version: 1,
    id,
    createdAt: now,
    updatedAt: now,
    hint: hint || '',
    encryption: {
      algorithm: encrypted.algorithm,
      kdf: encrypted.kdf,
      kdfIterations: encrypted.kdfIterations,
      kdfHash: encrypted.kdfHash,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag
    },
    ciphertext: encrypted.ciphertext
  };

  fs.writeFileSync(getEntryPath(id), JSON.stringify(entry, null, 2), 'utf8');
  return { id, createdAt: now, hint: entry.hint };
}

/**
 * Read and decrypt a diary entry.
 * Returns the full entry object with a `text` field containing the plaintext.
 */
function readEntry(id, password) {
  const filePath = getEntryPath(id);
  if (!fs.existsSync(filePath)) {
    throw new Error('Entry not found');
  }

  const entry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const encryptedData = {
    ...entry.encryption,
    ciphertext: entry.ciphertext
  };

  const text = decrypt(encryptedData, password);
  return {
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    hint: entry.hint,
    text
  };
}

/**
 * Update an existing diary entry with new text and/or hint.
 * Re-encrypts with the provided password.
 */
function updateEntry(id, text, password, hint) {
  const filePath = getEntryPath(id);
  if (!fs.existsSync(filePath)) {
    throw new Error('Entry not found');
  }

  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const encrypted = encrypt(text, password);

  const entry = {
    version: existing.version,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    hint: hint !== undefined ? hint : existing.hint,
    encryption: {
      algorithm: encrypted.algorithm,
      kdf: encrypted.kdf,
      kdfIterations: encrypted.kdfIterations,
      kdfHash: encrypted.kdfHash,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag
    },
    ciphertext: encrypted.ciphertext
  };

  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
  return { id, updatedAt: entry.updatedAt, hint: entry.hint };
}

/**
 * Permanently delete a diary entry.
 */
function deleteEntry(id) {
  const filePath = getEntryPath(id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * List all diary entries (metadata only — no plaintext).
 * Sorted by creation date, newest first.
 */
function listEntries() {
  const dir = getEntriesDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.diary'));

  return files
    .map(f => {
      try {
        const entry = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return {
          id: entry.id,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          hint: entry.hint
        };
      } catch {
        return null; // Skip corrupted files
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  createEntry,
  readEntry,
  updateEntry,
  deleteEntry,
  listEntries,
  getEntriesDir,
  getEntryPath
};
