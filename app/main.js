const { app, dialog, BrowserWindow, Menu } = require('electron');
const childProcess = require('child_process');
const rq = require('request-promise');
const settings = require('electron-settings');

settings.defaults({
  port: 8899,
  bounds: {
    width: 1260,
    height: 800,
  },
});

let mainWindow;
let mainAddr;
let subprocess;

function chooseFilename() {
  const fileNames = dialog.showOpenDialog({ title: 'Choose Beancount file' });
  if (fileNames === undefined) return;
  settings.setSync('beancount-file', fileNames[0]);
}

const template = [
  {
    label: 'Fava',
    submenu: [
      {
        role: 'quit',
      },
    ],
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Beancount file',
        accelerator: 'CmdOrCtrl+O',
        click() {
          chooseFilename();
          // TODO: possible best to integrate an interface on fava to do this
          // restarting the process is harder to get right ...
          //
          // subprocess.kill('SIGTERM');
          // subprocess = startFava();
        },
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'resetzoom',
      },
      {
        role: 'zoomin',
      },
      {
        role: 'zoomout',
      },
      {
        type: 'separator',
      },
      {
        role: 'togglefullscreen',
      },
    ],
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize',
      },
      {
        role: 'close',
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);

function startFava() {
  const args = [
    settings.getSync('beancount-file'),
    '-p',
    settings.getSync('port'),
  ];

  // click will abort if the locale is not set
  const process = childProcess.spawn(`${app.getAppPath()}/bin/fava`, args,
      { env: { LC_ALL: 'en_US.UTF-8' } });

  process.on('error', () => {
    console.log('Failed to start Fava.');
  });

  // subprocess.stdout.on('data', data => {
  //   console.log(`Fava stdout: ${data}`);
  // });

  // subprocess.stderr.on('data', data => {
  //   console.log(`Fava stderr: ${data}`);
  // });

  process.on('close', (code) => {
    console.log(`Fava exited with code ${code}`);
  });

  return process;
}

function createWindow() {
  let win = new BrowserWindow({
    'node-integration': false,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hidden-inset',
  });

  win.loadURL(`file://${__dirname}/index.html`);

  win.webContents.on('did-navigate', () => {
    win.webContents.insertCSS(`
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

  win.on('close', () => {
    settings.setSync('bounds', win.getBounds());
  });

  win.on('closed', () => {
    win = null;
  });

  return win;
}

function startUp() {
  rq(mainAddr)
    .then(() => {
      mainWindow.setBounds(settings.getSync('bounds'));
      mainWindow.loadURL(mainAddr);
    })
  .catch(() => {
    startUp();
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('quit', () => {
  subprocess.kill('SIGTERM');
});

app.on('ready', () => {
  Menu.setApplicationMenu(menu);

  if (settings.getSync('beancount-file') === undefined) {
    chooseFilename();
  }

  mainAddr = `http://localhost:${settings.getSync('port')}`;
  subprocess = startFava();
  mainWindow = createWindow();

  startUp();
});
