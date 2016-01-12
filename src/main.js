const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
electron.crashReporter.start({companyName: "Dominik Aumayr <dominik@aumayr.name>", submitURL: ""});

var mainWindow = null;

app.on('window-all-closed', function() {
    app.quit();
});

app.on('ready', function() {
  var subpy = require('child_process').spawn('beancount-web', ['/Volumes/Ledger/ledger-2015.beancount']);
  var rq = require('request-promise');
  var mainAddr = 'http://localhost:5000';

  var openWindow = function(){
    mainWindow = new BrowserWindow({'node-integration': false, width: 1260, height: 800, minWidth: 1260});
    mainWindow.loadURL('http://localhost:5000');
    // mainWindow.webContents.openDevTools();
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
        //console.log('waiting for the server start...');
        startUp();
      });
  };

  // fire!
  startUp();
});
