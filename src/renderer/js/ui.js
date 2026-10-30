/**
 * ui.js — DOM helper utilities.
 */

const UI = (() => {
  /**
   * Show a view by ID, hiding all others.
   */
  function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }

  /**
   * Show a modal by ID.
   */
  function showModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('hidden');
  }

  /**
   * Hide a modal by ID.
   */
  function hideModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('hidden');
  }

  /**
   * Show an error message in a target element.
   */
  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = `> ERROR: ${message}`;
      el.classList.remove('hidden');
    }
  }

  /**
   * Clear and hide an error message element.
   */
  function clearError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }

  /**
   * Toggle password visibility for an input element.
   */
  function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  /**
   * Trigger shake animation on an element.
   */
  function shake(element) {
    element.classList.remove('shake');
    // Force reflow to restart animation
    void element.offsetWidth;
    element.classList.add('shake');
    element.addEventListener('animationend', () => {
      element.classList.remove('shake');
    }, { once: true });
  }

  /**
   * Format an ISO date string to a human-readable form.
   */
  function formatDate(isoString) {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${date}  ${time}`;
  }

  /**
   * Escape HTML to prevent XSS when inserting user content.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    showView,
    showModal,
    hideModal,
    showError,
    clearError,
    togglePasswordVisibility,
    shake,
    formatDate,
    escapeHtml
  };
})();
