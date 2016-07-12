var runProcessWithOutput = require('../util/processutil').runProcessWithOutput;
var spawn = require('child_process').spawn;
var rimraf = require('rimraf');
var readdir = require('fs').readdir;

function updateServer(callback) {
  runProcessWithOutput(
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
    ],
    callback
  );
};

function generateAllSdks(callback) {
  var waitingOn = {};
  var files = readdir('sdks', null, function(err, files) {
    for (var i = 0; i < files.length; i++) {
      (function(file) {
        var sdk = file.substring(0, file.length - 5);
        var filename = 'sdks/'+file;
        if (filename.endsWith('.json')) {
          console.log('detected sdk - ' + file);

          rimraf('sdks/'+sdk, {}, function(err) {
            if (!err) { 
              waitingOn[filename] = true;
              console.log('generating sdk - ' + sdk);
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
                  ('sdks/'+sdk)
                ]
              );
              process.on('exit', (code) =>
              {
                console.log('generated sdk - ' + sdk);
                waitingOn[filename] = false;

                var stillWaiting = false;
                for (var name in waitingOn) {
                  if (waitingOn.hasOwnProperty(name)) {
                    if (waitingOn[name] === true) {
                      stillWaiting = true;
                      break;
                    }
                  }
                }

                if (!stillWaiting) {
                  console.log('all sdks have been built (on process exit)');
                  callback();
                }
              });
            } else {
              waitingOn[filename] = false;

              var stillWaiting = false;
              for (var name in waitingOn) {
                if (waitingOn.hasOwnProperty(name)) {
                  if (waitingOn[name] === true) {
                    stillWaiting = true;
                    break;
                  }
                }
              }

              if (!stillWaiting) {
                console.log('all sdks have been built (on process error)');
                callback();
              }
            }
          });
        }
      })(files[i]);
    }
  });
}

module.exports = {
  updateServer: updateServer,
  generateAllSdks: generateAllSdks,
};