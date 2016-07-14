var runProcessWithOutputAndWorkingDirectory = require('../../util/processutil').runProcessWithOutputAndWorkingDirectory;
var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');

function build(path, sdkConfig, callback) {
  if (/^win/.test(process.platform)) {
    runProcessWithOutputAndWorkingDirectory("build.bat", [], path, callback);
  } else {
    runProcessWithOutputAndWorkingDirectory("build.sh", [], path, callback);
  }
}

function pack(generationPath, targetPath, sdkConfig, callback) {
  fs.readdir(generationPath + "/bin", (err, files) => {
    if (err) {
      callback(err);
    } else {
      async.each(files, (filename, cb) => {
        fse.copy(generationPath + '/bin/' + filename, targetPath + '/' + filename, cb);
      }, callback);
    }
  });
}

function publishExternal(path, sdkConfig, callback) {
  console.log('csharp - no external publish step yet');
  callback();
}

module.exports = {
  build: build,
  pack: pack,
  publishExternal: publishExternal
};