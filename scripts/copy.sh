#!/bin/sh

rm -rf node_modules/auth
cp -r ~/work/auth node_modules/auth

rm node_modules/auth/zksnarkBuild/powersOfTau*

rm -rf packages/relay/keys
cp -R node_modules/auth/zksnarkBuild packages/relay/keys
