var runProcessWithOutputAndWorkingDirectory = require('../../util/processutil').runProcessWithOutputAndWorkingDirectory;
var fse = require('fs-extra');

function build(path, callback) {
  if (/^win/.test(process.platform)) {
    runProcessWithOutputAndWorkingDirectory("build.bat", [], path, callback);
  } else {
    runProcessWithOutputAndWorkingDirectory("build.sh", [], path, callback);
  }
}

function pack(generationPath, targetPath, callback) {
  console.log('packaging for csharp...');
  fse.copySync(generationPath + '/bin/RestSharp.dll', targetPath + '/RestSharp.dll');
  fse.copySync(generationPath + '/bin/Newtonsoft.Json.dll', targetPath + '/Newtonsoft.Json.dll');
  callback();
}

function publishExternal(path, callback) {
  console.log('csharp - no external publish step yet');
}

module.exports = {
  build: build,
  pack: pack,
  publishExternal: publishExternal
};