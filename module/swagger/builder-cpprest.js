var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var copyRecurse = require('../../util/copyutil').copyRecurse;

function pack(generationPath, targetPath, sdkConfig, callback) {
  fs.mkdir(targetPath, (err) => {
    if (err) {
      callback(err);
      return;
    }

    copyRecurse(
      generationPath, 
      targetPath,
      (currentDir, targetDir, filename) => {
        if (filename == 'test' ||
            filename == '.swagger-codegen-ignore' ||
            filename == 'git_push.sh') {
          return false;
        } else {
          return true;
        }
      }, callback);
  });
}

module.exports = {
  pack: pack
};