var runProcessWithOutputAndWorkingDirectory = require('../../util/processutil').runProcessWithOutputAndWorkingDirectory;
var runProcessAndCaptureAndWorkingDirectory = require('../../util/processutil').runProcessAndCaptureAndWorkingDirectory;
var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var configuration = require('../configuration');

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
      }, (err) => {
        if (err) {
          callback(err);
          return;
        }

        var config = configuration.getConfiguration(); 
    
        var nuspec = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd">
  <metadata>
    <id>` + sdkConfig.packageName + `</id>
    <version>` + config.package.version + `</version>
    <authors>` + config.package.author + `</authors>
    <description>` + config.package.description + `</description>
    <licenseUrl>http://spdx.org/licenses/` + config.package.clientLicense + `</licenseUrl>
    <projectUrl>` + config.package.homepage + `</projectUrl>
    <dependencies>
      <dependency id="RestSharp" version="105.1.0" />
      <dependency id="Newtonsoft.Json" version="8.0.3" />
    </dependencies>
  </metadata>
  <files>
    <file src="` + targetPath + '/' + sdkConfig.packageName + `*.*" target="lib" />
  </files>
</package>
`

        fs.writeFile(generationPath + '/' + sdkConfig.packageName + '.nuspec', nuspec, (err) => {
          runProcessWithOutputAndWorkingDirectory(
            'nuget',
            [
              'pack',
              sdkConfig.packageName + '.nuspec'
            ],
            generationPath,
            callback);
        });
      });
    }
  });
}

function publishExternal(generationPath, targetPath, sdkConfig, callback) {
  // TODO Have config passed in.
  var config = configuration.getConfiguration(); 

  runProcessAndCaptureAndWorkingDirectory(
    'nuget',
    [
      'list',
      sdkConfig.packageName,
      '-Source', 
      'https://www.nuget.org/api/v2',
      '-AllVersions'
    ],
    generationPath,
    (output, err) => {
      if (err) {
        callback(err);
        return;
      }

      var lines = output.split("\n");
      var found = false;
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() == sdkConfig.packageName + " " + config.package.version) {
          found = true;
          break;
        }
      }

      if (!found) {
        runProcessWithOutputAndWorkingDirectory(
          'nuget',
          [
            'push',
            sdkConfig.packageName + '.' + config.package.version + '.nupkg',
            '-Source', 
            'https://www.nuget.org/api/v2/package'
          ],
          generationPath,
          callback);
      } else {
        console.log('not republishing to nuget - this version is alredy published!')
        callback();
      }
    });
}

module.exports = {
  build: build,
  pack: pack,
  publishExternal: publishExternal
};