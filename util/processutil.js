var spawn = require('child_process').spawn;

module.exports = {
  runProcessWithOutput: function runProcessWithOutput(cmd, args, callback) {
    var child = spawn(
      cmd,
      args,
      { shell: true, stdio: ['ignore', process.stdout, process.stderr] }
    );
    child.on('exit', (code) => {
      callback()
    });
  }
}