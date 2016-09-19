# Orchestration

Orchestration is a set of utilities for Gulp that help you build and deploy versioned containers into clusters on cloud providers.

Orchestration is not specific to Node.js; you can use these Gulp tasks to deploy containers for any kind of service, written in any kind of language.

# Modules

Orchestration is divided into multiple NPM modules, each of which you can `npm install --save-dev` to install:

- [orchestration-docker](https://github.com/orchestration-nodejs/orchestration-docker): Build, test and deploy Docker images from Gulp.
- [orchestration-node](https://github.com/orchestration-nodejs/orchestration-node): Utility functions for launching and testing a Node application from Gulp.
- [orchestration-configuration](https://github.com/orchestration-nodejs/orchestration-configuration): Inspect the configuration of your deployment.
- [orchestration-swagger](https://github.com/orchestration-nodejs/orchestration-swagger): Interact with [Swagger](http://swagger.io/), the SDK generator.
- [orchestration-kubernetes](https://github.com/orchestration-nodejs/orchestration-kubernetes): Short-hand functions for launching and capturing the output of processes.
- [orchestration-phabricator](https://github.com/PageUpPeopleOrg/orchestration-phabricator): Query and retrieve credentials from a Phabricator instance.
- [orchestration-cloudformation](https://github.com/PageUpPeopleOrg/orchestration-cloudformation): Deploy CloudFormation stacks from Gulp.

Orchestration also provides several utility modules:

- [orchestration-util-copy](https://github.com/orchestration-nodejs/orchestration-util-copy): Useful functions for copying files and directories.
- [orchestration-util-process](https://github.com/orchestration-nodejs/orchestration-util-process): Deploy Docker images onto a Kubernetes cluster.

# Configuration

## Configuring your app

You need to have `package.json` in your app.  The name and version of `package.json` will be used for deployment.

## Configuring your app's deployment

Create an `orchestration.json` file, which describes the files to include and the services that your application exposes:

```javascript
{
  "services": {
    "development": [],
    "production": [
      {
        "type": "LoadBalancer",
        /* The external IP of the load balancer; reserve a static IP in your GCP console */
        "ipAddress": "1.1.1.1",
        "protocol": "TCP",
        /* Unique name for the exposed service in your cluster */
        "name": "my-service",
        "containerPort": 8080,
        "publicPort": 80
      }
    ]
  },
  "files": [
    /* Will be used in a future version, lists the files in your
       app to copy to a Docker container */
    "folder",
    "file",
    { "env": "environment-name", "name": "environment-specific-file" },
  ]
}
```

## Configuring your cluster

Create a `cluster.json` file, which describes the target cluster on Google Cloud:

```javascript
{
  /* Type of deployment, only Kubernetes on Google Cloud is supported for now */
  "type": "google-cloud-kubernetes",
  /* List of side-by-side deployment environments to support */
  "environments": {
    "development": {
      /* The GCP project for this environment */
      "project": "example-dev",
      /* The name of the GCP cluster for this environment */
      "clusterName": "example-dev",
      /* The zone of the GCP cluster for this environment */
      "clusterZone": "us-central1-f",
      /* The Docker image prefix to use for this environment */
      "dockerImagePrefix": "gcr.io/example-dev/"
    },
    "production": {
      "project": "example",
      "clusterName": "example",
      "clusterZone": "us-central1-f",
      "dockerImagePrefix": "gcr.io/example/"
    }
  }
}
```

The AWS CloudFormation provider makes use of CloudFormation templates, and does not use `cluster.json`.

Usage
======

```javascript
var configuration = require('orchestration-configuration');
var swagger = require('orchestration-swagger');
var docker = require('orchestration-docker');
var node = require('orchestration-node');
var kubernetes = require('orchestration-kubernetes');

// IMPORTANT: Don't forget to add this line to your Gulp file!
var config = configuration.getConfiguration();

// e.g. to generate sdks based on presence of .json files in sdks/ folder:
gulp.task('swagger-sdks', function(callback) {
  swagger.generateAllSdks(callback);
});

// e.g. to build a Docker container from the current folder:
gulp.task('build-docker', function(callback) {
  // targets the 'development' environment
  docker.build(config, 'development', callback);
});

// e.g. to run your Node.js app from within a Docker container:
gulp.task('test-docker', ['build-docker'], function(callback) {
  // test in dev with 8080 mapped to 8001
  // targets the 'development' environment
  docker.testLocal(config, 'development', { 8001: 8080 }, callback);
});

// e.g. to run your Node.js app on your host machine:
gulp.task('test-host', ['build'], function(callback) {
  node.test(callback);
});

// e.g. to deploy your Node.js app to a Kubernetes cluster in Google Cloud
gulp.task('deploy-prod', ['push-docker-prod'], function(callback) {
  // targets the 'production' environment
  kubernetes.deployToCluster(config, 'production', callback);
});
```

More functionality and examples coming soon.