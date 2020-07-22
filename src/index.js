const { app, BrowserWindow, Menu, ipcMain, dialog, Notification,  shell } = require('electron');
const path = require('path');
const settings = require('electron-settings');
const isMac = process.platform === 'darwin'

let settingsWindow = null;
let mainWindow;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.



  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    

  });




  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('close',function(e){
    mainWindow = null;
    if(settingsWindow != null) {
      settingsWindow.close()
      settingsWindow = null;

    }
    
  })

 
 
  

  // build menu
  const mainMenu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(mainMenu)

  // set path download 
  const download_dir = await settings.get('download_dir')
  if (!download_dir) {
    const homedir = require('os').homedir();
    const path_to_dl = path.join(homedir, 'Downloads')
    settings.set('download_dir', {
      path_to: path_to_dl
    })
  }
  


  // Running for the first time.


};

// create small window for settings 

const createSettingsWindow = () => {

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 150,

    webPreferences: {
      nodeIntegration: true
    }
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'))

  settingsWindow.on('close',function(e){
    settingsWindow = null
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  app.setName('Youtube-Converter')
  
  createWindow()

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});








// catch events


ipcMain.on('download_path', async (e, item) => {
  const download_dir = await settings.get('download_dir')
  e.reply('download_path-reply', download_dir.path_to)


})
//download directory change
ipcMain.on('download-change', async (e, item) => {
  let download_dir = await settings.get('download_dir')
  let res = await dialog.showOpenDialog({ defaultPath: download_dir.path_to, properties: ['openDirectory'] })
  if (res.canceled === false) {
    await settings.set('download_dir', {
      path_to: res.filePaths[0]
    })
    e.reply('download-change-repl', res.filePaths[0])
    mainWindow.webContents.send('download-change-repl', res.filePaths[0])
    const myNotification = new Notification()
    myNotification.title = 'Settings Change'
    myNotification.body = `Download directory path has been successfully changed to ${res.filePaths[0]}`
    myNotification.show()
  }



})

ipcMain.on('download-completed', (e, filename) => {

  const myNotification = new Notification()
  myNotification.title = 'Download Completed'
  myNotification.body = `${filename} has been successfully downloaded`
  myNotification.show()
})

ipcMain.on('download-start', (e, filename) => {

  const myNotification = new Notification()
  myNotification.title = 'Init Processing'
  myNotification.body = `Start downloading and processing ${filename}`
  myNotification.show()
})




// create menu 

const menuTemplate = [
  {
    label: app.name,
    submenu: [
      {
        label: 'Quit Youtube-Converter',
        role: 'quit'
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Paste URL',
        accelerator: isMac ? 'Command+V' : 'Ctrl+V',
        click() {
          console.log('clicked')
          mainWindow.webContents.send('paste-press', 'test')
        }
      },
      {
        label: 'Open Download Directory',
        accelerator: isMac ? 'Command+O' : 'Ctrl+O',
        async click() {
          try {
            let download_dir = await settings.get('download_dir')

            shell.openPath(download_dir.path_to)

          } catch (err) {
            throw err
          }

        }
      }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Change Download Directory',
        accelerator: isMac ? 'Command+I' : 'Ctrl+I',
        click() {
          createSettingsWindow()
        }
      }
    ]
  }
]
