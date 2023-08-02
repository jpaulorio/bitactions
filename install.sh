#!/usr/bin/env bash

export NODE=$(which node)

# Go to the BitBar plugins directory
cd "$HOME/Library/Application Support/xbar/plugins/"

# If already installed, check for version updates
if [ -d "github-build-monitor" ]; then
	cd github-build-monitor
	echo "Updating github-build-monitor..."
	git pull origin master --quiet
	echo "Updated successfully."
# If not installed, clone the repository
else
	echo "Downloading github-build-monitor..."
	git clone https://github.com/jpaulorio/github-build-monitor --quiet
	echo "Downloaded successfully."
	cd github-build-monitor
fi

# Install node dependencies
echo "Installing npm dependencies..."
npm install
echo "Dependencies installed."

# Create the symlink if it doesn't exist
cd ..
echo "Creating initialization xbar script..."
echo -e '#!/bin/bash \n' > github-build-monitor.1m.sh
echo "cd \"$PWD/github-build-monitor/\"" >> github-build-monitor.1m.sh
echo "$NODE \"$PWD/github-build-monitor/bin/cli.js\"" >> github-build-monitor.1m.sh
chmod +x github-build-monitor.1m.sh

echo "Done."	