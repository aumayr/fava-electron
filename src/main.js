const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
electron.crashReporter.start({companyName: "Dominik Aumayr <dominik@aumayr.name>", submitURL: ""});

const ElectronSettings = require('electron-settings');
var settings = new ElectronSettings();

if (settings.get('port') === undefined) {
    settings.set('port', 8889)
}

var mainWindow = null;

app.on('window-all-closed', function() {
    app.quit();
});

const dialog = require('dialog');

app.on('ready', function() {
    if (settings.get('beancount-file') === undefined) {
        dialog.showOpenDialog(function (fileNames) {
            console.log(fileNames)
            if (fileNames === undefined) return;
            var fileName = fileNames[0];
            settings.set('beancount-file', fileName);
        });
    }

    if (settings.get('fava-settings-file') === undefined) {
        dialog.showOpenDialog(function (fileNames) {
            console.log(fileNames)
            if (fileNames === undefined) return;
            var fileName = fileNames[0];
            settings.set('fava-settings-file', fileName);
        });
    }

    // TODO make settings work
    var processDescription = [settings.get('beancount-file'), '-p', settings.get('port'), '--settings', settings.get('fava-settings-file')];
    console.log('fava', processDescription);
    var subpy = require('child_process').spawn('fava', processDescription);
    var rq = require('request-promise');
    var mainAddr = 'http://' + settings.get('host') + ':' + settings.get('port');

    var openWindow = function(){
        mainWindow = new BrowserWindow({
            'node-integration': false,
            width: 1260,
            height: 800,
            minWidth: 1260,
            minHeight: 800,
            titleBarStyle: "hidden-inset"
        });
        mainWindow.loadURL(mainAddr);
        mainWindow.webContents.openDevTools();

        mainWindow.webContents.on('did-navigate', function(event, url) {
            mainWindow.webContents.insertCSS(`
                body header {
                    position: fixed;
                    width: 100%;
                    margin-top: -36px;
                    z-index: 7;
                    height: 36px;
                }

                body .main aside {
                    position: fixed;
                    z-index: 7;
                }

                body .main article {
                    margin-top: 36px;
                }

                body header .branding { margin-left: 68px; }
                body header nav ul.topmenu>li>a { line-height: 36px; }
                body header nav ul.topmenu>li>.filter { top: 36px; }
                body header .branding img { margin-top: 5px; }

                body header .branding h1 {
                    line-height: 36px;
                    padding: 0 10px;
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

        mainWindow.on('closed', function() {
            mainWindow = null;
            subpy.kill('SIGINT');
        });
    };

    var startUp = function(){
        rq(mainAddr)
        .then(function(htmlString){
            // console.log('server started!');
            openWindow();
        })
        .catch(function(err){
            // console.log('waiting for the server start...');
            startUp();
        });
    };

    // fire!
    startUp();
    // TODO save window state
});
