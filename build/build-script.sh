#!/usr/bin/env sh

PROJECT_DIR=$(dirname $(dirname $(realpath "$0")))
CURRENT_DIR=$(pwd)

if [ "$PROJECT_DIR" = "$CURRENT_DIR" ]; then
    npm run cleanBuild
    echo " ✔ Removing the old stuff"
    echo " ✔ Compiling the project"
    cp build/package.json dist/data-access
    echo " ✔ Copying the package.json file"
else
  echo "Build script should be executed from within the project's root directory"
fi