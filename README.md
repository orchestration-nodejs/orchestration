# Orchestration

This package provides utilities for Gulp that help you orchestrate the
deployment of Node.js microservices, and collectively version
them together for SDK generation.

# Modules

- `docker`: Build, push and test Docker images.
- `node`: Run a test Node.js server for debugging your app.
- `configuration`: Inspect the configuration of your deployment.
- `swagger`: Interact with [Swagger](http://swagger.io/), the SDK generator.
- `versionless`: Generate a versionless copy of `package.json` for inclusion in a Docker container.
- `kubernetes`: Deploy Docker images onto a Kubernetes cluster.

# Configuration

## Configuring your app

You need to have `package.json` in your app (as you do for all Node.js modules).  The name and version of `package.json` will be used for deployment.

## Configuring your app's deployment

Create an `orchestration.json` file, which describes the files to include and the services that your application exposes:

```javascript
{
  "deployStore": {
    /* In future, other providers will be supported */
    "type": "google-cloud-datastore", 
    /* Your Google Cloud project for deployment state storage */
    "project": "example-deploy" 
  },
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

**NOTE:** In future this state will be stored in an online service such as Google Cloud Datastore using your local credentials to coordinate microservice deployments.  When this happens, `cluster.json` will no longer be part of each microservice repository.

Create a `cluster.json` file, which describes your cluster on Google Cloud:

```javascript
{
  /* Type of deployment, only Kubernetes on Google Cloud is supported for now */
  "type": "google-cloud-kubernetes",
  /* These values should match the orchestration.json values for deployStore */
  "deployStore": {
    "type": "google-cloud-datastore",
    "project": "example-deploy"
  },
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

We intend to support other cloud providers in the future. 

Usage
======

```javascript
var orchestration = require('orchestration');

// IMPORTANT: Don't forget to add this line to your Gulp file!
var config = orchestration.configuration.getConfiguration();

// e.g. to generate sdks based on presence of .json files in sdks/ folder:
gulp.task('swagger-sdks', function(callback) {
  orchestration.swagger.generateAllSdks(callback);
});

// e.g. to generate a `package.json.versionless` file for use in a
//      Dockerfile with `ADD package.json.versionless /srv/package.json`:
gulp.task('generate-versionless', function(callback) {
  orchestration.versionless.generatePackageJson(callback);
});

// e.g. to build a Docker container from the current folder:
gulp.task('build-docker', ['generate-versionless'], function(callback) {
  orchestration.docker.build(
    'my-image-name',
    orchestration.packaging.getVersion(),
    'Dockerfile',
    callback
  );
});

// e.g. to run your Node.js app on your host machine:
gulp.task('test-host', ['build'], function(callback) {
  orchestration.node.test(callback);
});

// e.g. to run your Node.js app from within a Docker container:
gulp.task('test-docker', ['build-docker'], function(callback) {
  orchestration.docker.testContainer(
    'my-image-name',
    orchestration.packaging.getVersion(),
    { 8001: 8080 }, /* port mappings */
    callback
  )
});

// e.g. to deploy your Node.js app to a Kubernetes cluster in Google Cloud
gulp.task('deploy-prod', ['push-docker-prod'], function(callback) {
  orchestration.kubernetes.deployToCluster(
    config,
    'production',
    callback
  );
});
```

More functionality and examples coming soon.