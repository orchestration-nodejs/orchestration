var runProcessWithOutput = require('../util/processutil').runProcessWithOutput;
var runProcessWithOutputAndEnv = require('../util/processutil').runProcessWithOutputAndEnv;
var runProcessAndCapture = require('../util/processutil').runProcessAndCapture;
var spawn = require('child_process').spawn;

function ifClusterExists(project, zone, clusterName, onExistsCallback, onNotExistsCallback) {
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
    function(output) {
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

function ifDeploymentExists(deploymentName, onExistsCallback, onNotExistsCallback) {
  console.log("Checking if deployment exists...");
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
    function(output) {
      var data = JSON.parse(output);

      for (var i = 0; i < data.length; i++) {
        if (name == clusterName) {
          console.log("Found target deployment.");
          onExistsCallback();
          return;
        }
      }

      console.log("Target deployment is missing.");
      onNotExistsCallback();
    }
  )
}

function createDeployment(deploymentName, callback) {
  console.log("Creating Kubernetes deployment based on deployment.yaml...");
  runProcessWithOutputAndEnv(
    'kubectl',
    [
      'create',
      '-f',
      'deployment.yaml',
      '--record',
    ],
    {
      'KUBECONFIG': 'kubeconfig.cfg'
    },
    callback
  );
}

function deployToCluster(project, zone, clusterName, deploymentName, image, version, callback) {
  var continueDeployment2 = function() {
    patchDeployment(deploymentName, image, version, function() {
      monitorDeployment(deploymentName, callback);
    });
  }

  var continueDeployment = function() {
    runProcessWithOutputAndEnv(
      'gcloud',
      [
        '--project',
        project,
        'container',
        'cluster',
        'get-credentials',
        clusterName,
        '--zone',
        deploymentName
      ],
      {
        'KUBECONFIG': 'kubeconfig.cfg'
      },
      function() {
        ifDeploymentExists(deploymentName, continueDeployment2, () => {
          createDeployment(deploymentName, continueDeployment2);
        });
      }
    );
  };

  ifClusterExists(project, zone, clusterName, continueDeployment, () => {
    createMinimalCluster(project, zone, clusterName, continueDeployment);
  })
}

module.exports = {
  deployToCluster: deployToCluster
}