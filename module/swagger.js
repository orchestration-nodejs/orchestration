var runProcessAndCapture = require('../util/processutil').runProcessAndCapture;
var spawn = require('child_process').spawn;
var rimraf = require('rimraf');
var readdir = require('fs').readdir;
var fs = require('fs');
var async = require('async');

var builders = {
  'android': require('./swagger/builder-android'),
  'csharp': require('./swagger/builder-csharp'),
  'cpprest': require('./swagger/builder-cpprest'),
  'php': require('./swagger/builder-php')
}

function updateServer(callback) {
  console.log('updating server');
  var process = spawn(
    'java',
    [
      '-jar',
      'swagger-codegen-cli.jar',
      'generate',
      '-i',
      'swagger.yaml',
      '-l',
      'nodejs-server',
      '-o',
      '.'
    ]
  );
  process.on('exit', (exit) => {
    if (exit != 0) {
      console.log('failed to update server');
      callback(new Error('generate server had non-zero exit code'));
    } else {
      console.log('updated server');
      callback();
    }
  });
};

function logSdk(step, sdk) {
  console.log(step + " - " + sdk);
}
            
function packSdk(builders, sdk, sdkConfig, callback) {
  if (builders[sdk] && builders[sdk].pack) {
    logSdk('packaging', sdk);
    builders[sdk].pack('sdks/' + sdk, 'sdks/_package/' + sdk, sdkConfig, (err) => {
      if (!err) {
        logSdk('packaged', sdk);
        callback();
      } else {
        logSdk('failed to package', sdk);
        callback(err);
      }
    });
  } else {
    callback();
  }
}

function buildSdk(builders, sdk, sdkConfig, callback) {
  if (builders[sdk] && builders[sdk].build) {
    logSdk('building', sdk);
    builders[sdk].build('sdks/' + sdk, sdkConfig, (err) => {
      if (!err) {
        logSdk('built', sdk);
        packSdk(builders, sdk, sdkConfig, callback);
      } else {
        logSdk('failed to build', sdk);
        callback(err);
      }
    });
  } else {
    packSdk(builders, sdk, sdkConfig, callback);
  }
}

function generateSdk(builders, sdk, sdkConfig, callback) {
  var process = spawn(
    'java',
    [
      '-jar',
      'swagger-codegen-cli.jar',
      'generate',
      '-i',
      'swagger.yaml',
      '-l',
      sdk,
      '-o',
      ('sdks/'+sdk),
      '-c',
      ('sdks/'+sdk+'.json')
    ]
  );
  process.on('exit', (code) => {
    if (code != 0) { 
      logSdk('failed to generate', sdk);
      callback(new Error('sdk generation exited with non-zero exit code'));
    } else {
      logSdk('generated', sdk);
      buildSdk(builders, sdk, sdkConfig, callback);
    }
  });
}

function pregenerateSdk(file, callback) {
  var sdk = file.substring(0, file.length - 5);
  var filename = 'sdks/'+file;
  if (!filename.endsWith('.json')) {
    callback();
    return;
  }

  logSdk('detected', sdk);

  fs.readFile(filename, (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    var sdkConfig = JSON.parse(data);

    rimraf('sdks/'+sdk, {}, function(err) {
      if (err) {
        callback(new Error('unable to cleanup existing package directory'));
        return;
      }
      
      logSdk('generating', sdk);
      generateSdk(builders, sdk, sdkConfig, callback);   
    });
  });
}

function generateAllSdks(callback) {
  rimraf('sdks/_package', {}, function(){
    fs.mkdirSync('sdks/_package');
    var files = readdir('sdks', null, function(err, files) {
      async.each(files, pregenerateSdk, callback);
    });
  });
}


function publishSdk(file, callback) {
  var sdk = file.substring(0, file.length - 5);
  var filename = 'sdks/'+file;
  if (filename.endsWith('.json')) {
    fs.readFile(filename, (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      var sdkConfig = JSON.parse(data);

      if (builders[sdk].publishExternal) {
        logSdk('publishing externally', sdk);
        builders[sdk].publishExternal('sdks/' + sdk, 'sdks/_package/' + sdk, sdkConfig, (err) => {
          if (err) {
            logSdk('failed to publish externally', sdk);
          } else {
            logSdk('published externally', sdk);
          }

          callback(err);
        });
      } else {
        callback();
      }
    });
  }
}

function publishAllSdks(callback) {
  var files = readdir('sdks', null, function(err, files) {
    async.each(files, publishSdk, callback);
  });
}

module.exports = {
  updateServer: updateServer,
  generateAllSdks: generateAllSdks,
  publishAllSdks: publishAllSdks
};