var runProcessWithOutputAndWorkingDirectory = require('../../util/processutil').runProcessWithOutputAndWorkingDirectory;
var runProcessAndCaptureAndWorkingDirectory = require('../../util/processutil').runProcessAndCaptureAndWorkingDirectory;
var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var configuration = require('../configuration');
var requestify = require('requestify');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

function getNuGetMainProcess() {
  if (/^win/.test(process.platform)) {
    return "nuget";
  } else {
    return "mono";
  }
}

function getNuGetArguments(args) {
  if (!(/^win/.test(process.platform))) {
    args.splice(0, 0, "nuget.exe");
  }
  return args;
}

function build(path, sdkConfig, callback) {
  if (/^win/.test(process.platform)) {
    runProcessWithOutputAndWorkingDirectory("build.bat", [], path, callback);
  } else {
    runProcessWithOutputAndWorkingDirectory("chmod", ["a+x", "build.sh"], path, (err) => {
      if (err) {
        callback(err);
      } else {
        runProcessWithOutputAndWorkingDirectory("dos2unix", ["build.sh"], path, (err) => {
          if (err) {
            callback(err);
          } else {
            runProcessWithOutputAndWorkingDirectory("./build.sh", [], path, callback);
          }
        });
      }
    });

  }
}

function pack(generationPath, targetPath, sdkConfig, callback) {
  fs.readdir(generationPath + "/bin", (err, files) => {
    if (err) {
      callback(err);
    } else {
      fse.copy(generationPath + '/nuget.exe', targetPath + '/nuget.exe', (err) => {
        if (err) {
          callback(err);
          return;
        }
        
        async.each(files, (filename, cb) => {
          fse.copy(generationPath + '/bin/' + filename, targetPath + '/' + filename, cb);
        }, (err) => {
          if (err) {
            callback(err);
            return;
          }

          var config = configuration.getConfiguration();

          var p = "/";
          if (/^win/.test(process.platform)) {
            p = "\\";
          }

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
    <file src="` + sdkConfig.packageName + `*.*" target="lib\\net45" />
  </files>
</package>
`

          fs.writeFile(targetPath + '/' + sdkConfig.packageName + '.nuspec', nuspec, (err) => {
            runProcessWithOutputAndWorkingDirectory(
              getNuGetMainProcess(),
              getNuGetArguments([
                'pack',
                sdkConfig.packageName + '.nuspec'
              ]),
              targetPath,
              callback);
          });
        });
      });
    }
  });
}

function publishExternal(generationPath, targetPath, sdkConfig, callback) {
  // TODO Have config passed in.
  var config = configuration.getConfiguration(); 

  requestify.get("https://www.nuget.org/api/v2/Search()?$orderby=Id&$skip=0&$top=30&searchTerm='" + sdkConfig.packageName + "'&targetFramework=''&includePrerelease=false")
    .then((resp) => {
      var body = resp.body;
      var doc = new dom().parseFromString(body);
      var select = xpath.useNamespaces({
        "a": "http://www.w3.org/2005/Atom",
        "d": "http://schemas.microsoft.com/ado/2007/08/dataservices",
        "georss": "http://www.georss.org/georss",
        "gml": "http://www.opengis.net/gml",
        "m": "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"
      });
      var nodes = select("//a:entry", doc);
      var versionExists = false;
      for (var i = 0; i < nodes.length; i++) {
        var id = select("m:properties/d:Id", nodes[i])[0].firstChild.data;
        var version = select("m:properties/d:Version", nodes[i])[0].firstChild.data;
        if (id == sdkConfig.packageName && version == config.package.version) {
          versionExists = true;
        }
      }

      if (!versionExists) {
        console.log('pushing new version...');
        runProcessWithOutputAndWorkingDirectory(
          getNuGetMainProcess(),
          getNuGetArguments([
            'push',
            sdkConfig.packageName + '.' + config.package.version + '.nupkg',
            '-Source', 
            'https://www.nuget.org/api/v2/package'
          ]),
          targetPath,
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