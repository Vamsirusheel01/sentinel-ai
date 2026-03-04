const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Process references
let frontendProcess = null;
let backendProcess = null;
let agentProcess = null;

function startFrontend() {
  if (!frontendProcess) {
    frontendProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(__dirname, "../frontend"),
      shell: true
    });

    frontendProcess.stdout.on("data", (data) => {
      console.log("Frontend:", data.toString());
    });

    frontendProcess.stderr.on("data", (data) => {
      console.error("Frontend Error:", data.toString());
    });

    frontendProcess.on("close", (code) => {
      console.log("Frontend exited with code:", code);
      frontendProcess = null;
    });
  }
}

function startServices() {
  // Start backend process
  if (!backendProcess) {
    backendProcess = spawn("python", ["../backend/app.py"], {
      cwd: __dirname,
      shell: true
    });

    backendProcess.stdout.on("data", (data) => {
      console.log("Backend:", data.toString());
    });

    backendProcess.stderr.on("data", (data) => {
      console.error("Backend Error:", data.toString());
    });

    backendProcess.on("close", (code) => {
      console.log("Backend exited with code:", code);
      backendProcess = null;
    });
  }

  // Start agent process
  if (!agentProcess) {
    agentProcess = spawn("python", ["../Agent/run_agent.py"], {
      cwd: __dirname,
      shell: true
    });

    agentProcess.stdout.on("data", (data) => {
      console.log("Agent:", data.toString());
    });

    agentProcess.stderr.on("data", (data) => {
      console.error("Agent Error:", data.toString());
    });

    agentProcess.on("close", (code) => {
      console.log("Agent exited with code:", code);
      agentProcess = null;
    });
  }
}

function stopServices() {
  if (frontendProcess) {
    frontendProcess.kill();
    frontendProcess = null;
    console.log("Frontend stopped");
  }

  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    console.log("Backend stopped");
  }

  if (agentProcess) {
    agentProcess.kill();
    agentProcess = null;
    console.log("Agent stopped");
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = true;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../frontend/dist/index.html")
    );
  }
}

// IPC Handlers
ipcMain.handle('start-system', async () => {
  console.log('[IPC] Received start-system request');
  startServices();
  return { success: true, message: 'System started' };
});

ipcMain.handle('stop-system', async () => {
  console.log('[IPC] Received stop-system request');
  stopServices();
  return { success: true, message: 'System stopped' };
});

// Start app when ready
app.whenReady().then(() => {
  // Start frontend first
  startFrontend();
  
  // Wait for frontend to be ready, then start backend/agent and create window
  setTimeout(() => {
    startServices();
    createWindow();
  }, 3000); // 3 second delay for frontend to start
  
  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit cleanly when all windows are closed
app.on('window-all-closed', () => {
  stopServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Stop processes before quitting
app.on('before-quit', (event) => {
  console.log('[System] Before-quit event triggered');
  
  // Always call stopServices to ensure processes are killed
  if (frontendProcess !== null || backendProcess !== null || agentProcess !== null) {
    console.log('[System] Stopping processes before quit...');
    event.preventDefault();
    
    // Call stopServices to kill processes
    stopServices();
    
    // Add small delay to ensure kill signals are sent
    setTimeout(() => {
      console.log('[System] Cleanup complete, exiting');
      // Force-kill any remaining processes before final quit
      if (frontendProcess !== null) {
        try {
          frontendProcess.kill('SIGKILL');
        } catch (e) {}
        frontendProcess = null;
      }
      if (backendProcess !== null) {
        try {
          backendProcess.kill('SIGKILL');
        } catch (e) {}
        backendProcess = null;
      }
      if (agentProcess !== null) {
        try {
          agentProcess.kill('SIGKILL');
        } catch (e) {}
        agentProcess = null;
      }
      app.quit();
    }, 500); // 500ms delay
  }
});

// Final safeguard: handle any remaining processes on exit
process.on('exit', () => {
  console.log('[System] Process exit handler triggered - final cleanup');
  
  // Force-kill any zombie processes
  try {
    if (frontendProcess !== null && frontendProcess.pid) {
      console.log('[System] Force-killing frontend process:', frontendProcess.pid);
      frontendProcess.kill('SIGKILL');
    }
  } catch (e) {
    console.warn('[System] Could not kill frontend:', e.message);
  }

  try {
    if (backendProcess !== null && backendProcess.pid) {
      console.log('[System] Force-killing backend process:', backendProcess.pid);
      backendProcess.kill('SIGKILL');
    }
  } catch (e) {
    console.warn('[System] Could not kill backend:', e.message);
  }
  
  try {
    if (agentProcess !== null && agentProcess.pid) {
      console.log('[System] Force-killing agent process:', agentProcess.pid);
      agentProcess.kill('SIGKILL');
    }
  } catch (e) {
    console.warn('[System] Could not kill agent:', e.message);
  }
});
