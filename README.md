Orchestration
===============

This package provides utilities for Gulp that help you orchestrate the
deployment of Node.js microservices, and collectively version
them together for SDK generation.

Modules
==========

- `docker`: Utilities for building, pushing and testing Docker images.
- `node`: Utilities for running Node.js test servers.
- `packaging`: Utilities for obtaining information about the package to be deployed.
- `swagger`: Utilities for interacting with (http://swagger.io/)[Swagger], the SDK generator.
- `versionless`: Utilities for generating a versionless `package.json` file, for inclusion in Docker containers.

Usage
======

```javascript
var orchestration = require('orchestration');

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

```

More functionality and examples coming soon.