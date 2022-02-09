# Publish Package to npmjs manual

## Description
The document describes the steps that need to be done to set up automatic deployment of the package to the npm registry on the GitHub release event.

## Initial infrastructure set up
1. Sign up for [npmjs](https://www.npmjs.com/).
1. Generate a new `automation` access [token](https://docs.npmjs.com/creating-and-viewing-access-tokens).
1. Make sure that the `name` property in your `package.json` file matches the following pattern: `@npmjs-your-name/your-package-name`. For example, if your npm scope prefix is `octocat` and the package name is `hello-world`, the name in your package.json file should be @octocat/hello-world.
1. Add a new repository level secret `NPM_TOKEN` [variable](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) for GitHub Actions.

## Deployment
1. Increment the package `version` in your `package.json` file.
1. Create a new GitHub [release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release).
1. Once a GitHub action gets completed you will be able to access your newly deployed package via npm.