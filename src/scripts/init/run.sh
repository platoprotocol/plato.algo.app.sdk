#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

. ./env.local

../../../node_modules/.bin/ts-node ./script.ts
