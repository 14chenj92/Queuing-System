// const { app, BrowserWindow } = require('electron');
// const path = require('path');

// function createWindow() {
//   const win = new BrowserWindow({
//     fullscreen: true,
//     kiosk: true,
//     frame: false,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true
//     }
//   });

//   win.loadURL('https://badmintonq-7a2cf48bee0f.herokuapp.com/');
// }

// app.whenReady().then(() => {
//   createWindow();

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
