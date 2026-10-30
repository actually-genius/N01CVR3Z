/**
 * boot.js — Terminal boot sequence.
 * Quiet. Tired. Like a machine that's been on too long.
 */

const Boot = (() => {
  const LINES = [
    { text: '> n01cvr3z v1.0.0', cls: 'boot-label', delay: 400 },
    { text: '> loading crypto ................... ok', cls: 'boot-ok', delay: 500 },
    { text: '> checking storage ................. ok', cls: 'boot-ok', delay: 350 },
    { text: '> initializing cipher .............. ok', cls: 'boot-ok', delay: 450 },
    { text: '> ready.', cls: 'boot-ok', delay: 500 },
    { text: '', cls: 'boot-empty', delay: 400 },
    { text: 'still here? okay. let\'s begin.', cls: 'boot-quote', delay: 1000 },
    { text: '', cls: 'boot-empty', delay: 500 },
    { text: '[press any key]', cls: 'boot-prompt', delay: 0 }
  ];

  function run(container) {
    return new Promise(async (resolve) => {
      container.innerHTML = '';

      for (const line of LINES) {
        if (line.delay > 0) {
          await sleep(line.delay);
        }
        const el = document.createElement('div');
        el.className = `boot-line ${line.cls}`;
        el.textContent = line.text;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
      }

      const cursor = document.createElement('span');
      cursor.className = 'boot-cursor';
      container.lastElementChild.appendChild(cursor);

      const handler = (e) => {
        e.preventDefault();
        document.removeEventListener('keydown', handler);
        container.removeEventListener('click', handler);
        cursor.remove();
        resolve();
      };

      document.addEventListener('keydown', handler);
      container.addEventListener('click', handler);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  return { run };
})();
