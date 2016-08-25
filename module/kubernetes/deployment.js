var runProcessAndCapture = require('../../util/processutil').runProcessAndCapture;
var runProcessWithOutputAndEnvAndInput = require('../../util/processutil').runProcessWithOutputAndEnvAndInput;
var process = require('process');

function getDeploymentDocument(deploymentName, image, version, containerPorts) {
  var containerPortsBuilt = [];
  for (var i = 0; i < containerPorts.length; i++) {
    containerPortsBuilt.push({
      "containerPort": containerPorts[i]
    });
  }

  return {
    "apiVersion": "extensions/v1beta1",
    "kind": "Deployment",
    "metadata": {
      "name": deploymentName
    },
    "spec": {
      "replicas": 2,
      "template": {
        "metadata": {
          "labels": {
            "app": deploymentName
          }
        },
        "spec": {
          "containers": [
            {
              "name": deploymentName,
              "image": image + ":" + version,
              "ports": containerPortsBuilt,
              "resources": {
                "requests": {
                  "cpu": 0
                }
              }
            }
          ]
        }
      }
    }
  }
}

function ifDeploymentExists(deploymentName, onExistsCallback, onNotExistsCallback, onErrorCallback) {
  console.log("Checking if deployment exists...");
  runProcessAndCapture(
    'kubectl',
    [
      '--output',
      'json',
      'get',
      'deployments'
    ],
    function(output, err) {
      if (err) { onErrorCallback(err); return; }

      var data = JSON.parse(output);

      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].metadata.name == deploymentName) {
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

function createDeployment(deploymentName, image, version, containerPorts, callback) {
  console.log("Creating Kubernetes deployment for container...");
  runProcessWithOutputAndEnvAndInput(
    'kubectl',
    [
      'create',
      '-f',
      '-',
      '--record',
    ],
    {
      'HOME': process.cwd()
    },
    JSON.stringify(getDeploymentDocument(deploymentName, image, version, containerPorts)),
    callback
  );
}

function replaceDeployment(deploymentName, image, version, containerPorts, callback) {
  console.log("Updating Kubernetes deployment with new version...");
  runProcessWithOutputAndEnvAndInput(
    'kubectl',
    [
      'replace',
      'deployment',
      deploymentName,
      '-f',
      '-',
      '--record'
    ],
    {
      'HOME': process.cwd()
    },
    JSON.stringify(getDeploymentDocument(deploymentName, image, version, containerPorts)),
    callback
  );
}

function waitForDeploymentToComplete(deploymentName, image, version, callback) {
  console.log("TODO: Monitor deployment");
  callback();
}

module.exports = {
  ifDeploymentExists: ifDeploymentExists,
  createDeployment: createDeployment,
  replaceDeployment: replaceDeployment,
  waitForDeploymentToComplete: waitForDeploymentToComplete,
}