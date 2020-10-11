#!/bin/bash

cd ../vue3-ui/ && \
npm run build && \
cp ./dist/bundle.js ../demo/node_modules/@pathscale/vue3-ui/dist/
