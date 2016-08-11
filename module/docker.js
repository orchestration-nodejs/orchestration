var runProcessWithOutput = require('../util/processutil').runProcessWithOutput;
var spawn = require('child_process').spawn;
var fs = require('fs');

function getDockerfile(config, environment) {
  if (config.orchestration.packageType == null || config.orchestration.packageType == 'nodejs') {
    var dockerfile = `
FROM node:latest
WORKDIR /srv
ADD package.json.versionless /srv/package.json
RUN npm install
ADD package.json /srv/package.json
`;
  } else if (config.orchestration.packageType == 'custom') {
    var dockerfile = `
FROM ` + config.orchestration.packageBase + `
WORKDIR /srv
`;
  } else {
    throw 'Unknown or not supported package type: ' + config.orchestration.packageType + '.'
  }

  if (config.orchestration.packageType == 'custom' && config.orchestration.packagePreCommands != null) {
    for (var i = 0; i < config.orchestration.packagePreCommands.length; i++) {
      dockerfile += "RUN " + config.orchestration.packagePreCommands[i] + "\n";
    }
  }

  for (var i = 0; i < config.orchestration.files.length; i++) {
    var value = config.orchestration.files[i];
    if (typeof value == "string") {
      // Always include
      dockerfile += "ADD " + value + " /srv/" + value + "\n";
    } else {
      if (value.env == environment) {
        dockerfile += "ADD " + value.name + " /srv/" + value.name + "\n";
      }
    }
  }

  for (var i = 0; i < config.orchestration.services.length; i++) {
    var value = config.orchestration.services[i][environment];
    dockerfile += "EXPOSE " + value.containerPort + "\n";
  }

  if (config.orchestration.packageType == 'custom' && config.orchestration.packagePostCommands != null) {
    for (var i = 0; i < config.orchestration.packagePostCommands.length; i++) {
      dockerfile += "RUN " + config.orchestration.packagePostCommands[i] + "\n";
    }
  }

  if (config.orchestration.packageType == null || config.orchestration.packageType == 'nodejs') {
    dockerfile += "CMD NODE_ENV=" + environment + " node " + config.package.main;
  } else if (config.orchestration.packageType == 'custom') {
    dockerfile += "CMD " + config.orchestration.packageEnvironmentVariable + "=" + environment + " " + config.orchestration.packageRun;
  }

  return dockerfile;
}

function getVersionlessPackageJson(callback) {
  // Convert to JSON and parse again to get a copy.
  var packageInfo = JSON.parse(JSON.stringify(require(process.cwd() + '/package.json')));
  packageInfo.version = "1.0.0";
  packageInfo.devDependencies = {};
  return JSON.stringify(packageInfo);
}

function cleanupFile(file, err, callback) {
  fs.unlink(file, (errUnlink) => {
    if (err) {
      callback(err);
    } else if (errUnlink) {
      callback(errUnlink);
    } else {
      callback();
    }
  });
}

function build(config, environment, callback) {
  var dockerPrefix = config.cluster.environments[environment].dockerImagePrefix;

  fs.writeFile('Dockerfile.tmp', getDockerfile(config, environment), (err) => {
    if (err) { callback(err); return; }

    var cleanupDockerfile = (err) => { cleanupFile('Dockerfile.tmp', err, callback); };

    fs.writeFile('package.json.versionless', getVersionlessPackageJson(), (err) => {
      if (err) {
        cleanupDockerfile(err);
        return;
      }

      var cleanupVersionless = (err) => { cleanupFile('package.json.versionless', err, cleanupDockerfile); };

      runProcessWithOutput(
        'docker',
        [
          'build',
          '-t',
          dockerPrefix + config.package.name + ":" + config.package.version,
          '-f',
          'Dockerfile.tmp',
          '.'
        ],
        cleanupVersionless
      );
    });
  });
}

function push(config, environment, callback) {
  var dockerPrefix = config.cluster.environments[environment].dockerImagePrefix;

  if (dockerPrefix == "" || dockerPrefix[dockerPrefix.length - 1] != "/") {
    callback(new Error("Docker prefix in cluster does not end with a slash, refusing to push to potentially public location!"));
    return;
  }

  if (config.cluster.type == "google-cloud-kubernetes") {
    runProcessWithOutput(
      'gcloud',
      [
        '--project=' + config.cluster.environments[environment].project,
        'docker',
        'push',
        dockerPrefix + config.package.name + ":" + config.package.version,
      ],
      callback
    );
  } else {
    runProcessWithOutput(
      'docker',
      [
        'push',
        dockerPrefix + config.package.name + ":" + config.package.version,
      ],
      callback
    );
  }
}

function testLocal(config, environment, devPorts, callback) {
  var dockerPrefix = config.cluster.environments[environment].dockerImagePrefix;
  var containerName = 'orchestration-test-' + config.package.name;
  var args1 = [
    'run',
    '--rm',
    '--name=' + containerName
  ];
  var args2 = [
    dockerPrefix + config.package.name + ":" + config.package.version
  ];
  var argsPorts = [];
  for (var source in devPorts) {
    if (devPorts.hasOwnProperty(source)) {
      argsPorts.push('-p');
      argsPorts.push(source + ":" + devPorts[source]);
    }
  }
  var child = spawn(
    'docker',
    args1.concat(argsPorts).concat(args2),
    {
      env: {
        'NODE_ENV': environment,
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
  testLocal: testLocal,
}