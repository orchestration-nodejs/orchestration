function getOrchestrationDocument() {
  return require(process.cwd() + '/orchestration.json');
}

function getPackageDocument() {
  return require(process.cwd() + '/package.json');
}

function getClusterDocument() {
  // WARN: This will eventually move into an online datastore, instead
  // of having a cluster.json file in each microservice.
  return require(process.cwd() + '/cluster.json');
}

function getConfiguration() {
  return {
    orchestration: getOrchestrationDocument(),
    package: getPackageDocument(),
    cluster: getClusterDocument(),
  };
}

module.exports = {
  getConfiguration: getConfiguration
}

