var runProcessWithOutput = require('../util/processutil').runProcessWithOutput;
var spawn = require('child_process').spawn;

function build(name, version, dockerfile, callback) {
  runProcessWithOutput(
    'docker',
    [
      'build',
      '-t',
      name + ":" + version,
      '-f',
      dockerfile,
      '.'
    ],
    callback
  );
}

function push(name, version, callback) {
  runProcessWithOutput(
    'docker',
    [
      'push',
      name + ":" + version
    ],
    callback
  );
}

function pushGoogleCloud(project, name, version, callback) {
  runProcessWithOutput(
    'gcloud',
    [
      '--project=' + project,
      'docker',
      'push',
      name + ":" + version
    ],
    callback
  );
}

function testContainer(name, version, ports, callback) {
  var containerName = 'orchestration-test-' + Math.random();
  var args1 = [
    'run',
    '--rm',
    '--name=' + containerName
  ];
  var args2 = [
    name + ":" + version
  ];
  var argsPorts = [];
  for (var source in ports) {
    if (ports.hasOwnProperty(source)) {
      argsPorts.push('-p');
      argsPorts.push(source + ":" + ports[source]);
    }
  }
  var child = spawn(
    'docker',
    args1.concat(argsPorts).concat(args2),
    {
      env: {
        'NODE_ENV': 'development',
      },
      shell: true,
      detached: true
    });
  child.on('exit', (code) => {
    console.log('Stopping container...');
    var stopChild = spawn('docker', [ 'stop', containerName ], { shell: true });
    stopChild.on('exit', (stopCode) => {
      console.log('Removing container...');
      var rmChild = spawn('docker', [ 'rm', containerName ], { shell: true });
      rmChild.on('exit', (rmCode) => {
        callback();
      });      
    });
  });
}

module.exports = {
  build: build,
  push: push,
  pushGoogleCloud: pushGoogleCloud,
  testContainer: testContainer,
}