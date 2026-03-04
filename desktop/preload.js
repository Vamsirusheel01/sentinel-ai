const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  ipcSend: (channel, data) => {
    if (channel) {
      ipcRenderer.send(channel, data);
    }
  },
  ipcOn: (channel, callback) => {
    if (channel) {
      ipcRenderer.on(channel, (event, data) => callback(data));
    }
  },
  ipcInvoke: (channel, data) => {
    if (channel) {
      return ipcRenderer.invoke(channel, data);
    }
  }
});

// Expose system control API
contextBridge.exposeInMainWorld('api', {
  startSystem: () => ipcRenderer.invoke('start-system'),
  stopSystem: () => ipcRenderer.invoke('stop-system')
});
