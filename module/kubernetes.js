var cluster = require('./kubernetes/cluster');
var deployment = require('./kubernetes/deployment');
var service = require('./kubernetes/service');

function deployToCluster(config, environment, callback) {
  var monitorDeployment = function(err) {
    if (err) { callback(err); return; }
    deployment.waitForDeploymentToComplete(
      config.package.name,
      config.package.name,
      config.package.version,
      callback);
  }

  var processService = function(services, offset, onSuccess, onError) {
    var services = config.orchestration.services[environment];

    var next = function() {
      if (offset == services.length - 1) {
        onSuccess();
      } else {
        processService(services, offset + 1, onSuccess, onError);
      }
    }

    service.ifServiceExists(
      services[offset].name,
      next,
      () => {
        service.createServiceForDeployment(
          config.package.name,
          services[offset],
          (err) => {
            if (err) {
              onError(err);
            } else {
              next();
            }
          }
        )
      });
  }

  var deployServices = function(err) {
    if (err) { callback(err); return; }

    var services = config.orchestration.services[environment];
    if (services.length > 0) {
      processService(services, 0, monitorDeployment, callback);
    } else {
      monitorDeployment();
    }
  }

  var deployContainers = function(err) {
    if (err) { callback(err); return; }

    var dockerPrefix = config.cluster.environments[environment].dockerImagePrefix;

    var services = config.orchestration.services[environment];
    var containerPorts = [];
    for (var i = 0; i < services.length; i++) {
      var containerPort = services[i].containerPort;
      if (containerPort != null) {
        containerPorts.push(containerPort);
      }
    }

    cluster.loadAuthenticationCredentials(
      config.cluster.environments[environment].project, 
      config.cluster.environments[environment].clusterName, 
      config.cluster.environments[environment].clusterZone, 
      function(err) {
        if (err) { callback(err); return; }
        deployment.ifDeploymentExists(
          config.package.name, 
          () => {
            deployment.replaceDeployment(
              config.package.name, 
              dockerPrefix + config.package.name,
              config.package.version,
              containerPorts,
              deployServices);
          },
          () => {
            deployment.createDeployment(
              config.package.name, 
              dockerPrefix + config.package.name,
              config.package.version,
              containerPorts,
              deployServices);
          },
          callback);
      });
  };

  console.log("Deploying " + config.package.name + " at version " + config.package.version + " to cluster...");

  cluster.ifClusterExists(
    config.cluster.environments[environment].project, 
    config.cluster.environments[environment].clusterZone, 
    config.cluster.environments[environment].clusterName, 
    deployContainers, 
    () => {
      cluster.createMinimalCluster(
        config.cluster.environments[environment].project, 
        config.cluster.environments[environment].clusterZone, 
        config.cluster.environments[environment].clusterName, 
        deployContainers);
    },
    callback);
}

module.exports = {
  deployToCluster: deployToCluster
}