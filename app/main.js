const {app, dialog, BrowserWindow, Menu} = require('electron');
const childProcess = require('child_process');
const rq = require('request-promise');
const settings = require('electron-settings');

const template = [
{
  label: 'File',
  submenu: [
  {
    label: 'Open Beancount file',
    accelerator: 'CmdOrCtrl+O',
    click (item, window) {
      chooseFilename();
      // TODO: possible best to integrate an interface on fava to do this
      // restarting the process is harder to get right ...
      //
      // subprocess.kill('SIGTERM');
      // subprocess = startFava();
    }
  },
  ]
},
{
  label: 'View',
  submenu: [
  {
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click (item, focusedWindow) {
      if (focusedWindow) focusedWindow.reload()
    }
  },
  {
    label: 'Toggle Developer Tools',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click (item, focusedWindow) {
      if (focusedWindow) focusedWindow.webContents.toggleDevTools()
    }
  },
  {
    type: 'separator'
  },
  {
    role: 'resetzoom'
  },
  {
    role: 'zoomin'
  },
  {
    role: 'zoomout'
  },
  {
    type: 'separator'
  },
  {
    role: 'togglefullscreen'
  }
  ]
},
{
  role: 'window',
  submenu: [
  {
    role: 'minimize'
  },
  {
    role: 'close'
  }
  ]
}
];

const menu = Menu.buildFromTemplate(template)

settings.defaults({
    port: 8899,
    bounds: {
        width: 1260,
        height: 800,
    },
})

let mainWindow;
let mainAddr;
let subprocess;

function startFava() {
    const args = [
        settings.getSync('beancount-file'),
        '-p',
        settings.getSync('port'),
    ];

    // click will abort if the locale is not set
    const subprocess = childProcess.spawn(app.getAppPath() + '/bin/fava', args, {env: {LC_ALL: 'en_US.UTF-8'}});

    subprocess.on('error', err => {
      console.log('Failed to start Fava.');
    });

    // subprocess.stdout.on('data', data => {
    //   console.log(`Fava stdout: ${data}`);
    // });

    // subprocess.stderr.on('data', data => {
    //   console.log(`Fava stderr: ${data}`);
    // });

    subprocess.on('close', code => {
      console.log(`Fava exited with code ${code}`);
    });

    return subprocess;
}

function chooseFilename() {
    let fileNames = dialog.showOpenDialog({ title: 'Choose Beancount file' });
    if (fileNames === undefined) return;
    fileName = fileNames[0];
    settings.setSync('beancount-file', fileName);
}

function createWindow(){
    const bounds = settings.getSync('bounds');

    mainWindow = new BrowserWindow({
        'node-integration': false,
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 600,
        minHeight: 400,
        titleBarStyle: "hidden-inset"
    });

    mainWindow.loadURL(mainAddr);
    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('did-navigate', (event, url) => {
        mainWindow.webContents.insertCSS(`
            body header {
                -webkit-app-region: drag;
                padding-left: 80px;
            }
            body header svg {
                display: none;
            }
        `);
    });

    // mainWindow.webContents.on('did-finish-load', function() {
    //     mainWindow.webContents.executeJavaScript(`
    //         window.onclick = function(e) {
    //             if (e.target.localName == 'a') {
    //                 e.preventDefault();
    //                 $.ajax({
    //                     async: true,
    //                     type: "GET",
    //                     url: e.target.getAttribute('href'),
    //                     success: function (html) {
    //                         document.documentElement.innerHTML = html;
    //                     }
    //                 });
    //             }
    //         };
    //     `);
    // });

    mainWindow.on('close', () => {
        settings.setSync('bounds', mainWindow.getBounds());
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

function startUp(){
    rq(mainAddr)
    .then(htmlString => {
        createWindow();
    })
    .catch(err => {
        startUp();
    });
};

app.on('window-all-closed', () => {
    app.quit();
});

app.on('quit', () => {
    subprocess.kill('SIGTERM');
});

app.on('ready', () => {
    Menu.setApplicationMenu(menu)

    if (settings.getSync('beancount-file') === undefined) {
        chooseFilename();
    }

    mainAddr = `http://localhost:${settings.getSync('port')}`;
    subprocess = startFava();

    startUp();
});
