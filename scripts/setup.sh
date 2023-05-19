#!/bin/sh

rm -rf node_modules/auth
ln -s ~/work/auth node_modules/auth

rm -rf packages/relay/keys
cp -R node_modules/auth/zksnarkBuild packages/relay/keys
