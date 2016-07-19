var runProcessWithOutput = require('../../util/processutil').runProcessWithOutput;
var runProcessWithOutputAndEnv = require('../../util/processutil').runProcessWithOutputAndEnv;
var runProcessAndCapture = require('../../util/processutil').runProcessAndCapture;
var process = require('process');

function ifClusterExists(project, zone, clusterName, onExistsCallback, onNotExistsCallback, onErrorCallback) {
  console.log("Checking if target cluster exists...")
  runProcessAndCapture(
    'gcloud',
    [
      '--format',
      'json',
      '--project',
      project,
      'container',
      'clusters',
      'list',
      '--zone',
      zone
    ],
    function(output, err) {
      if (err) { onErrorCallback(err); return; }

      var data = JSON.parse(output);

      for (var i = 0; i < data.length; i++) {
        if (data[i].name == clusterName) {
          console.log("Found target cluster.");
          onExistsCallback();
          return;
        }
      }

      console.log("Target cluster is missing.");
      onNotExistsCallback();
    }
  )
}

function createMinimalCluster(project, zone, clusterName, callback) {
  console.log("Creating minimal cluster to satisify deployment requirements...");
  runProcessWithOutput(
    'gcloud',
    [
      '--project',
      project,
      'container',
      'clusters',
      'create',
      clusterName,
      '--enable-autoscaling',
      '--no-async',
      '--machine-type',
      'g1-small',
      '--max-nodes',
      '1',
      '--num-nodes',
      '1',
      '--min-nodes',
      '1',
      '--zone',
      zone
    ],
    callback
  );
}

function loadAuthenticationCredentials(project, clusterName, zone, callback) {
  var p = "/";
  if (/^win/.test(process.platform)) {
    p = "\\";
  }

  runProcessWithOutputAndEnv(
    'gcloud',
    [
      '--project',
      project,
      'container',
      'clusters',
      'get-credentials',
      clusterName,
      '--zone',
      zone
    ],
    {
      'KUBECONFIG': process.cwd() + p + ".kube" + p + "config"
    },
    callback
  );
}

module.exports = {
  ifClusterExists: ifClusterExists,
  createMinimalCluster: createMinimalCluster,
  loadAuthenticationCredentials: loadAuthenticationCredentials,
}