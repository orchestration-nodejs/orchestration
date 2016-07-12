var process = require('process');

function getVersion() {
  return require(process.cwd() + '/package.json').version;
}

module.exports = {
  getVersion: getVersion
}