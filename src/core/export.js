const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const { getEntriesDir, getEntryPath } = require('./storage');

/**
 * Export one or more diary entries to a user-chosen location.
 * Single entry → .diary file.  Multiple → .diary-bundle (JSON array).
 */
async function exportEntries(win, ids) {
  const isSingle = ids.length === 1;

  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Diary Entries',
    defaultPath: isSingle ? `entry-${ids[0].slice(0, 8)}.diary` : 'diary-export.diary-bundle',
    filters: isSingle
      ? [{ name: 'Diary Entry', extensions: ['diary'] }]
      : [{ name: 'Diary Bundle', extensions: ['diary-bundle'] }]
  });

  if (!filePath) return null;

  if (isSingle) {
    const src = getEntryPath(ids[0]);
    if (!fs.existsSync(src)) throw new Error('Entry not found');
    fs.copyFileSync(src, filePath);
  } else {
    const entries = ids.map(id => {
      const src = getEntryPath(id);
      if (!fs.existsSync(src)) throw new Error(`Entry ${id} not found`);
      return JSON.parse(fs.readFileSync(src, 'utf8'));
    });
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  return filePath;
}

/**
 * Import diary entries from .diary or .diary-bundle files.
 * Skips duplicates (same ID already exists) and invalid files.
 */
async function importEntries(win) {
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import Diary Entries',
    filters: [
      { name: 'Diary Files', extensions: ['diary', 'diary-bundle'] }
    ],
    properties: ['openFile', 'multiSelections']
  });

  if (!filePaths || filePaths.length === 0) return [];

  const imported = [];
  const skipped = [];
  const entriesDir = getEntriesDir();

  for (const fp of filePaths) {
    try {
      const content = fs.readFileSync(fp, 'utf8');
      const data = JSON.parse(content);
      const entries = Array.isArray(data) ? data : [data];

      for (const entry of entries) {
        // Validate required fields
        if (!entry.id || !entry.ciphertext || !entry.encryption) {
          skipped.push({ file: fp, reason: 'Invalid entry structure' });
          continue;
        }

        const destPath = path.join(entriesDir, `${entry.id}.diary`);
        if (fs.existsSync(destPath)) {
          skipped.push({ id: entry.id, reason: 'Duplicate' });
          continue;
        }

        fs.writeFileSync(destPath, JSON.stringify(entry, null, 2), 'utf8');
        imported.push({
          id: entry.id,
          createdAt: entry.createdAt,
          hint: entry.hint
        });
      }
    } catch {
      skipped.push({ file: fp, reason: 'Failed to parse' });
    }
  }

  return { imported, skipped };
}

module.exports = { exportEntries, importEntries };
