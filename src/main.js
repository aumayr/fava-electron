const {app, dialog, BrowserWindow} = require('electron');
const child_process = require('child_process');
const rq = require('request-promise');
const settings = require('electron-settings');

settings.defaults({
    port: 8899,
    host: 'localhost',
    bounds: {
        width: 1260,
        height: 800,
    },
})

let mainWindow;
let mainAddr;
let subprocess;

function startFava(fileName) {
    const processDescription = [
        fileName,
        '-p', settings.getSync('port'),
    ];

    const subprocess = child_process.spawn(app.getAppPath() + '/bin/fava', processDescription);

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

app.on('window-all-closed', () => {
    app.quit();
});

app.on('quit', () => {
    subprocess.kill('SIGTERM');
});

app.on('ready', () => {
    let fileName = settings.getSync('beancount-file');
    if (fileName === undefined) {
        var fileNames = dialog.showOpenDialog({ title: 'Choose Beancount file' });
        if (fileNames === undefined) return;
        fileName = fileNames[0];
        settings.setSync('beancount-file', fileName);
    }

    mainAddr = `http://${settings.getSync('host')}:${settings.getSync('port')}`;
    subprocess = startFava(fileName);

    function startUp(){
        rq(mainAddr)
        .then(htmlString => {
            createWindow();
        })
        .catch(err => {
            startUp();
        });
    };

    startUp();
});
