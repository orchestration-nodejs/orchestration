var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');

function copyRecurse(currentDir, targetDir, filter, callback) {
  fs.readdir(currentDir, (err, files) => {
    if (err) {
      callback(err);
      return;
    }

    async.each(files, (filename, callback) => {
      if (!filter(currentDir, targetDir, filename)) {
        // skip file
        callback();
        return;
      }

      fs.lstat(currentDir + '/' + filename, (err, stats) => {
        if (err) {
          callback(err);
          return;
        }

        if (stats.isDirectory()) {
          fs.mkdir(targetDir + '/' + filename, (err) => {
            if (err) {
              callback(err);
              return;
            }

            copyRecurse(
              currentDir + '/' + filename,
              targetDir + '/' + filename,
              filter,
              callback);
          });  
        } else {
          fse.copy(
            currentDir + '/' + filename,
            targetDir + '/' + filename,
            callback);
        }
      })
    }, callback);
  })
}

module.exports = {
  copyRecurse: copyRecurse
}