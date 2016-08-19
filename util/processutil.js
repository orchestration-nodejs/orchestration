var spawn = require('child_process').spawn;
var process = require('process');

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

function runProcessWithOutputAndWorkingDirectory(cmd, args, cwd, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: true, cwd: cwd, stdio: ['ignore', process.stdout, process.stderr] }
  );
  child.on('exit', (code) => {
    if (code != 0) {
      callback(new Error('Process exited with non-zero exit code.'));
    } else {
      callback()
    }
  });
}

function runProcessWithOutputNoShell(cmd, args, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: false, stdio: ['ignore', process.stdout, process.stderr] }
  );
  child.on('exit', (code) => {
    if (code != 0) {
      callback(new Error('Process exited with non-zero exit code.'));
    } else {
      callback()
    }
  });
}

function runProcessWithOutputAndEnv(cmd, args, envNew, callback) {
  var env = {};
  for (var name in process.env) {
    if (process.env.hasOwnProperty(name)) {
      if (process.platform == 'win32') {
        env[name.toUpperCase()] = process.env[name];
      } else {
        env[name] = process.env[name];
      }
    }
  }
  for (var name in envNew) {
    if (envNew.hasOwnProperty(name)) {
      if (process.platform == 'win32') {
        env[name.toUpperCase()] = envNew[name];
      } else {
        env[name] = envNew[name];
      }
    }
  }
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

function runProcessWithOutputAndEnvAndInput(cmd, args, envNew, input, callback) {
  var env = {};
  for (var name in process.env) {
    if (process.env.hasOwnProperty(name)) {
      if (process.platform == 'win32') {
        env[name.toUpperCase()] = process.env[name];
      } else {
        env[name] = process.env[name];
      }
    }
  }
  for (var name in envNew) {
    if (envNew.hasOwnProperty(name)) {
      if (process.platform == 'win32') {
        env[name.toUpperCase()] = envNew[name];
      } else {
        env[name] = envNew[name];
      }
    }
  }
  var child = spawn(
    cmd,
    args,
    { shell: true, env: env, stdio: ['pipe', process.stdout, process.stderr] }
  );
  child.stdin.setEncoding('utf-8');
  child.stdin.write(input);
  child.stdin.end();
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

function runProcessAndCaptureAndWorkingDirectory(cmd, args, cwd, callback) {
  var child = spawn(
    cmd,
    args,
    { shell: true, cwd: cwd, stdio: ['ignore', 'pipe', process.stderr] }
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
  runProcessWithOutputNoShell: runProcessWithOutputNoShell,
  runProcessWithOutputAndWorkingDirectory: runProcessWithOutputAndWorkingDirectory,
  runProcessWithOutputAndEnv: runProcessWithOutputAndEnv,
  runProcessWithOutputAndEnvAndInput: runProcessWithOutputAndEnvAndInput,
  runProcessAndCapture: runProcessAndCapture,
  runProcessAndCaptureAndWorkingDirectory: runProcessAndCaptureAndWorkingDirectory,
};