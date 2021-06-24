#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    path="$HOME/.config/junto"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    path="$HOME/Library/Application Support/junto"
fi

echo "Will delete path: $path"
# read -p "IS THIS CORRECT? (y/n) " answer

# if [[ $answer =~ ^[Yy]$ ]] ;
# then
#     echo "Accepted, deleting directory"
rm -rf $path
# else
#     echo "Not deleting"
# fi
