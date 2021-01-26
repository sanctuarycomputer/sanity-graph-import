#!/bin/bash

# Create a test studio
rm -rf test-studio/*
yarn sanity init -y --create-project "SGI Test Studio" --dataset production --template moviedb --output-path test-studio
cd test-studio
yarn add @sanity/cli
yarn sanity dataset create staging --visibility public

cd ..
# Populate the envirnment variables
node ./scripts/test-studio/init-vars.js
