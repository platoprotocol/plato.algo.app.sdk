#!/bin/bash

set -e

. ./env.local

python3 src/contracts/delivery/app.py
