var spawn = require('child_process').spawn;

function test(callback) {
  var child = spawn('node', ['index.js'], {
    env: {
      'NODE_ENV': 'development',
    },
    shell: true,
    detached: true
  });
  child.on('exit', (code) => {
    callback();
  });
}

module.exports = {
  test: test
};