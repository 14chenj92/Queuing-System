const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,  // Open in fullscreen mode
    kiosk: true,       // Kiosk mode (prevents users from exiting)
    frame: false,      // Removes window border
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your URL or local HTML file
  win.loadURL('https://badmintonq-7a2cf48bee0f.herokuapp.com/');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
