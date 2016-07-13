var runProcessAndCapture = require('../util/processutil').runProcessAndCapture;
var spawn = require('child_process').spawn;
var rimraf = require('rimraf');
var readdir = require('fs').readdir;
var fs = require('fs');

var builders = {
  'csharp': require('./swagger/builder-csharp')
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

function generateAllSdks(callback) {
  var waitingOn = {};
  rimraf('sdks/_package', {}, function(){
    fs.mkdirSync('sdks/_package');
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
                    ('sdks/'+sdk),
                    '-c',
                    ('sdks/'+sdk+'.json')
                  ]
                );
                process.on('exit', (code) => {
                  var wrapup = function() {
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
                  }

                  if (code != 0) { 
                    console.log('failed to generate sdk - ' + sdk);
                    wrapup();
                  } else {
                    console.log('generated sdk - ' + sdk);
                    if (builders[sdk]) {
                      builders[sdk].build('sdks/' + sdk, (err) => {
                        if (!err) {
                          builders[sdk].pack('sdks/' + sdk, 'sdks/_package/' + sdk, (err) => {
                            if (!err) {
                              builders[sdk].publishExternal('sdks/_package/' + sdk, wrapup);
                            } else {
                              wrapup();
                            }
                          });
                        } else {
                          wrapup();
                        }
                      });
                    } else {
                      wrapup();
                    }
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
  });
}

module.exports = {
  updateServer: updateServer,
  generateAllSdks: generateAllSdks,
};