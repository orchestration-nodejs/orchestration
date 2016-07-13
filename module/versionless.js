var fs = require('fs');

function generatePackageJson(callback) {
  // Convert to JSON and parse again to get a copy.
  var packageInfo = JSON.parse(JSON.stringify(require(process.cwd() + '/package.json')));
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