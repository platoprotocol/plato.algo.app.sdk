#!/bin/bash

set -e

. ./env.local

python3 src/contracts/delivery/app.py
python3 src/contracts/identity/app.py
python3 src/contracts/reward/app.py
