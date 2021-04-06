require = require("esm")(module/*, options*/)
//module.exports = require("./main.js")
const { app, BrowserWindow } = require('electron');
const ad4m = require("ad4m-core-executor");

app.whenReady().then(() => {
    const execPath = "./resources/linux";
    console.log("Resource path", execPath);
    
    console.log("Init AD4M...");
    ad4m.init(app.getPath('appData'), execPath, "./ad4m/languages", ["languages", "agent-profiles", "shared-perspectives"]).then(ad4mCore => {
        console.log("Starting account creation splash screen");
        ad4mCore.initControllers();
    
        const splash = createSplash()
        ad4mCore.waitForAgent().then(() => {
            console.log("Controllers init");
            ad4mCore.initControllers();
            splash.close();
            createWindow();
        })
    });
})

/// This is the window where a user should create their DID
function createSplash () {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      },
      minimizable: false,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
    })
  
    // and load the index.html of the app.
    win.loadFile('./index.html');
  
    // Open the DevTools.
    //win.webContents.openDevTools()
  
    return win
}
  
/// This is the window which is the main entry point to the application
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('index.html');
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
