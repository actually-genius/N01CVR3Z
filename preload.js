const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, typed API to the renderer process.
// No raw IPC access — only these whitelisted channels.

contextBridge.exposeInMainWorld('diary', {
  list: () => ipcRenderer.invoke('diary:list'),
  create: (text, password, hint) =>
    ipcRenderer.invoke('diary:create', { text, password, hint }),
  read: (id, password) =>
    ipcRenderer.invoke('diary:read', { id, password }),
  update: (id, text, password, hint) =>
    ipcRenderer.invoke('diary:update', { id, text, password, hint }),
  delete: (id) =>
    ipcRenderer.invoke('diary:delete', { id }),
  export: (ids) =>
    ipcRenderer.invoke('diary:export', { ids }),
  import: () =>
    ipcRenderer.invoke('diary:import')
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close')
});
