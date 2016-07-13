var runProcessAndCapture = require('../../util/processutil').runProcessAndCapture;
var runProcessWithOutputAndEnv = require('../../util/processutil').runProcessWithOutputAndEnv;
var process = require('process');

function ifServiceExists(serviceName, onExistsCallback, onNotExistsCallback, onErrorCallback) {
  console.log("Checking if service exists...");
  runProcessAndCapture(
    'kubectl',
    [
      '--output',
      'json',
      'get',
      'services'
    ],
    function(output, err) {
      if (err) { onErrorCallback(err); return; }

      var data = JSON.parse(output);

      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].metadata.name == serviceName) {
          console.log("Found target service.");
          onExistsCallback();
          return;
        }
      }

      console.log("Target service is missing.");
      onNotExistsCallback();
    }
  )
}

function createServiceForDeployment(deploymentName, serviceProps, callback) {
  console.log("Creating service for deployment " + deploymentName + "...");

  if (serviceProps.type != "LoadBalancer") {
    callback(new Error("Only services of type 'LoadBalancer' are supported at the moment."));
    return;
  }

  runProcessWithOutputAndEnv(
    'kubectl',
    [
      'expose',
      'deployment',
      deploymentName,
      '--port='+serviceProps.publicPort,
      '--target-port='+serviceProps.containerPort,
      '--type='+serviceProps.type,
      '--protocol='+serviceProps.protocol,
      '--load-balancer-ip='+serviceProps.ipAddress,
      '--name='+serviceProps.name
    ],
    {
      'HOME': process.cwd()
    },
    callback
  );
}

module.exports = {
  ifServiceExists: ifServiceExists,
  createServiceForDeployment: createServiceForDeployment,
};