#!/bin/bash

# Create a test studio
# rm -rf test-studio/*
# yarn sanity init -y --create-project "SGI Test Studio" --dataset production --template moviedb --output-path test-studio
# cd test-studio
# yarn add @sanity/cli 
# yarn sanity dataset create staging --visibility public
# yarn sanity dataset import ../scripts/test-studio/initialSanityData.tar.gz production --replace
#
#
# cd ..
# # Populate the envirnment variables
# node ./scripts/test-studio/init-vars.js
#
echo "Almost there! To complete setup, create a token in your project settings, then add it to .env"
read -p "Press enter to open the management console for your project" y

cd test-studio
yarn sanity manage


