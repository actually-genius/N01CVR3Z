const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Show window once DOM is ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ──────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ─── Diary IPC handlers ────────────────────────────────────────

const { createEntry, readEntry, updateEntry, deleteEntry, listEntries } = require('./src/core/storage');
const { exportEntries, importEntries } = require('./src/core/export');

ipcMain.handle('diary:list', async () => {
  try {
    return { success: true, data: listEntries() };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('diary:create', async (_, { text, password, hint }) => {
  try {
    return { success: true, data: createEntry(text, password, hint) };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('diary:read', async (_, { id, password }) => {
  try {
    return { success: true, data: readEntry(id, password) };
  } catch (e) {
    return { success: false, error: 'Wrong password or corrupted entry.' };
  }
});

ipcMain.handle('diary:update', async (_, { id, text, password, hint }) => {
  try {
    return { success: true, data: updateEntry(id, text, password, hint) };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('diary:delete', async (_, { id }) => {
  try {
    deleteEntry(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('diary:export', async (_, { ids }) => {
  try {
    const result = await exportEntries(mainWindow, ids);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('diary:import', async () => {
  try {
    const result = await importEntries(mainWindow);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── Window control IPC ────────────────────────────────────────

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});
