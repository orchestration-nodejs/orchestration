var spawn = require('child_process').spawn;

function runProcessWithOutput(cmd, args, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: true, stdio: ['ignore', process.stdout, process.stderr] }
  );
  child.on('exit', (code) => {
    if (code != 0) {
      callback(new Error('Process exited with non-zero exit code.'));
    } else {
      callback()
    }
  });
}

function runProcessWithOutputAndEnv(cmd, args, env, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: true, env: env, stdio: ['ignore', process.stdout, process.stderr] }
  );
  child.on('exit', (code) => {
    if (code != 0) {
      callback(new Error('Process exited with non-zero exit code.'));
    } else {
      callback()
    }
  });
}

function runProcessAndCapture(cmd, args, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: true, stdio: ['ignore', 'pipe', process.stderr] }
  );
  var buffer = "";
  child.stdout.on('data', (data) => {
    buffer += data;
  });
  child.on('close', (code) => {
    if (code != 0) {
      callback(buffer, new Error('Process exited with non-zero exit code.'));
    } else {
      callback(buffer)
    }
  });
}

module.exports = {
  runProcessWithOutput: runProcessWithOutput,
  runProcessWithOutputAndEnv: runProcessWithOutputAndEnv,
  runProcessAndCapture: runProcessAndCapture,
};