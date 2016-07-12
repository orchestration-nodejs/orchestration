var fs = require('fs');

function generatePackageJson(callback) {
  var packageInfo = require(process.cwd() + '/package.json');
  packageInfo.version = "1.0.0";
  packageInfo.devDependencies = {};
  fs.writeFile('package.json.versionless', JSON.stringify(packageInfo), function(err) {
    if (err) {
      callback(err);
    }

    callback();
  });
}

module.exports = {
  generatePackageJson: generatePackageJson,
};