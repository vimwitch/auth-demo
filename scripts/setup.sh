#!/bin/sh

rm -rf node_modules/auth
git clone https://github.com/unirep/auth.git node_modules/auth
(cd node_modules/auth ; yarn ; yarn build)
rm node_modules/auth/zksnarkBuild/powersOfTau*

rm -rf packages/relay/keys
cp -R node_modules/auth/zksnarkBuild packages/relay/keys
