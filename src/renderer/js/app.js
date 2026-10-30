/**
 * app.js — Main application controller for N01CVR3Z.
 * Handles all user interactions, view routing, and diary CRUD operations.
 */

(async () => {
  // ─── State ───────────────────────────────────────────────────
  let entries = [];
  let currentEntry = null;   // { id, text, hint, createdAt, updatedAt }
  let currentPassword = null; // kept in memory only while read/edit view is active

  // ─── Boot ────────────────────────────────────────────────────
  const bootOutput = document.getElementById('boot-output');
  await Boot.run(bootOutput);
  await loadEntries();
  UI.showView('list-view');

  // ─── Window Controls ────────────────────────────────────────
  document.getElementById('btn-minimize').addEventListener('click', () => {
    window.windowControls.minimize();
  });
  document.getElementById('btn-close').addEventListener('click', () => {
    window.windowControls.close();
  });

  // ─── Entry List ──────────────────────────────────────────────

  async function loadEntries() {
    const result = await window.diary.list();
    if (result.success) {
      entries = result.data;
    } else {
      entries = [];
    }
    renderEntryList();
  }

  function renderEntryList() {
    const container = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');
    const exportBtn = document.getElementById('btn-export-selected');

    container.innerHTML = '';

    if (entries.length === 0) {
      container.classList.add('hidden');
      emptyState.classList.remove('hidden');
      exportBtn.disabled = true;
      return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'entry-item';
      item.innerHTML = `
        <input type="checkbox" class="entry-check" data-id="${entry.id}">
        <span class="entry-date">${UI.formatDate(entry.createdAt)}</span>
        <span class="entry-hint">${UI.escapeHtml(entry.hint || '')}</span>
        <span class="entry-lock">🔒</span>
      `;

      // Click on the row (not checkbox) opens the entry
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('entry-check')) return;
        openEntry(entry);
      });

      container.appendChild(item);
    });

    // Update export button state based on checkbox selection
    container.addEventListener('change', () => {
      const checked = container.querySelectorAll('.entry-check:checked');
      exportBtn.disabled = checked.length === 0;
    });
  }

  // ─── Open Entry (Password Modal) ────────────────────────────

  function openEntry(entry) {
    currentEntry = entry;
    const hintEl = document.getElementById('modal-hint');
    const pwInput = document.getElementById('modal-password');

    hintEl.textContent = entry.hint || '';
    pwInput.value = '';
    UI.clearError('modal-error');
    UI.showModal('password-modal');
    setTimeout(() => pwInput.focus(), 100);
  }

  document.getElementById('btn-unlock').addEventListener('click', attemptUnlock);
  document.getElementById('modal-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });

  async function attemptUnlock() {
    const pw = document.getElementById('modal-password').value;
    if (!pw) {
      UI.showError('modal-error', 'Password cannot be empty.');
      return;
    }

    const result = await window.diary.read(currentEntry.id, pw);
    if (result.success) {
      currentPassword = pw;
      currentEntry = result.data;
      UI.hideModal('password-modal');
      showReadView();
    } else {
      UI.showError('modal-error', 'Wrong password. The seal holds.');
      UI.shake(document.querySelector('#password-modal .modal-content'));
    }
  }

  document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    UI.hideModal('password-modal');
    currentEntry = null;
    currentPassword = null;
  });

  document.getElementById('btn-toggle-modal-pw').addEventListener('click', () => {
    UI.togglePasswordVisibility('modal-password');
  });

  // ─── Read View ───────────────────────────────────────────────

  function showReadView() {
    document.getElementById('read-date').textContent = UI.formatDate(currentEntry.createdAt);
    const hintEl = document.getElementById('read-hint');
    hintEl.textContent = currentEntry.hint || '';
    document.getElementById('read-content').textContent = currentEntry.text;
    UI.showView('read-view');
  }

  document.getElementById('btn-back-from-read').addEventListener('click', () => {
    clearSensitive();
    UI.showView('list-view');
  });

  // ─── New Entry ───────────────────────────────────────────────

  document.getElementById('btn-new-entry').addEventListener('click', () => {
    document.getElementById('new-entry-text').value = '';
    document.getElementById('new-entry-hint').value = '';
    document.getElementById('new-entry-password').value = '';
    document.getElementById('new-entry-password-confirm').value = '';
    UI.clearError('new-entry-error');
    UI.showView('new-entry-view');
    setTimeout(() => document.getElementById('new-entry-text').focus(), 100);
  });

  document.getElementById('btn-save-new').addEventListener('click', saveNewEntry);

  async function saveNewEntry() {
    const text = document.getElementById('new-entry-text').value.trim();
    const hint = document.getElementById('new-entry-hint').value.trim();
    const pw = document.getElementById('new-entry-password').value;
    const pwConfirm = document.getElementById('new-entry-password-confirm').value;

    if (!text) {
      UI.showError('new-entry-error', 'Your confession cannot be empty.');
      return;
    }
    if (!pw) {
      UI.showError('new-entry-error', 'You must set a password to seal this entry.');
      return;
    }
    if (pw.length < 4) {
      UI.showError('new-entry-error', 'Password must be at least 4 characters.');
      return;
    }
    if (pw !== pwConfirm) {
      UI.showError('new-entry-error', 'Passwords do not match.');
      return;
    }

    UI.clearError('new-entry-error');
    const result = await window.diary.create(text, pw, hint);

    if (result.success) {
      await loadEntries();
      UI.showView('list-view');
    } else {
      UI.showError('new-entry-error', result.error || 'Failed to save.');
    }
  }

  document.getElementById('btn-cancel-new').addEventListener('click', () => {
    UI.showView('list-view');
  });
  document.getElementById('btn-back-from-new').addEventListener('click', () => {
    UI.showView('list-view');
  });

  document.getElementById('btn-toggle-new-pw').addEventListener('click', () => {
    UI.togglePasswordVisibility('new-entry-password');
  });

  // ─── Edit Entry ──────────────────────────────────────────────

  document.getElementById('btn-edit-entry').addEventListener('click', () => {
    if (!currentEntry || !currentEntry.text) return;
    document.getElementById('edit-entry-text').value = currentEntry.text;
    document.getElementById('edit-entry-hint').value = currentEntry.hint || '';
    document.getElementById('edit-entry-password').value = '';
    document.getElementById('edit-entry-password-confirm').value = '';
    UI.clearError('edit-entry-error');
    UI.showView('edit-view');
    setTimeout(() => document.getElementById('edit-entry-text').focus(), 100);
  });

  document.getElementById('btn-save-edit').addEventListener('click', saveEditEntry);

  async function saveEditEntry() {
    const text = document.getElementById('edit-entry-text').value.trim();
    const hint = document.getElementById('edit-entry-hint').value.trim();
    const pw = document.getElementById('edit-entry-password').value;
    const pwConfirm = document.getElementById('edit-entry-password-confirm').value;

    if (!text) {
      UI.showError('edit-entry-error', 'Your confession cannot be empty.');
      return;
    }
    if (!pw) {
      UI.showError('edit-entry-error', 'You must set a new password to re-seal.');
      return;
    }
    if (pw.length < 4) {
      UI.showError('edit-entry-error', 'Password must be at least 4 characters.');
      return;
    }
    if (pw !== pwConfirm) {
      UI.showError('edit-entry-error', 'Passwords do not match.');
      return;
    }

    UI.clearError('edit-entry-error');
    const result = await window.diary.update(currentEntry.id, text, pw, hint);

    if (result.success) {
      clearSensitive();
      await loadEntries();
      UI.showView('list-view');
    } else {
      UI.showError('edit-entry-error', result.error || 'Failed to save.');
    }
  }

  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    UI.showView('read-view');
  });
  document.getElementById('btn-back-from-edit').addEventListener('click', () => {
    UI.showView('read-view');
  });

  document.getElementById('btn-toggle-edit-pw').addEventListener('click', () => {
    UI.togglePasswordVisibility('edit-entry-password');
  });

  // ─── Delete Entry ────────────────────────────────────────────

  document.getElementById('btn-delete-entry').addEventListener('click', () => {
    UI.showModal('delete-modal');
  });

  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (!currentEntry) return;
    const result = await window.diary.delete(currentEntry.id);
    UI.hideModal('delete-modal');

    if (result.success) {
      clearSensitive();
      await loadEntries();
      UI.showView('list-view');
    }
  });

  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    UI.hideModal('delete-modal');
  });

  // ─── Export ──────────────────────────────────────────────────

  document.getElementById('btn-export-selected').addEventListener('click', async () => {
    const checked = document.querySelectorAll('.entry-check:checked');
    const ids = Array.from(checked).map(cb => cb.dataset.id);

    if (ids.length === 0) return;

    const result = await window.diary.export(ids);
    if (result.success && result.data) {
      // Briefly flash the button to indicate success
      const btn = document.getElementById('btn-export-selected');
      const original = btn.textContent;
      btn.textContent = '[Exported ✓]';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }
  });

  // ─── Import ──────────────────────────────────────────────────

  document.getElementById('btn-import').addEventListener('click', async () => {
    const result = await window.diary.import();
    if (result.success && result.data) {
      const { imported, skipped } = result.data;
      if (imported.length > 0) {
        await loadEntries();
        const btn = document.getElementById('btn-import');
        const original = btn.textContent;
        btn.textContent = `[${imported.length} imported ✓]`;
        setTimeout(() => { btn.textContent = original; }, 2000);
      }
    }
  });

  // ─── Helpers ─────────────────────────────────────────────────

  /**
   * Clear sensitive data from memory when leaving read/edit views.
   */
  function clearSensitive() {
    if (currentEntry) currentEntry.text = null;
    currentPassword = null;
    document.getElementById('read-content').textContent = '';
  }

  // ─── Keyboard Shortcuts ──────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
      if (!document.getElementById('password-modal').classList.contains('hidden')) {
        UI.hideModal('password-modal');
        currentEntry = null;
        currentPassword = null;
      }
      if (!document.getElementById('delete-modal').classList.contains('hidden')) {
        UI.hideModal('delete-modal');
      }
    }
  });

})();
