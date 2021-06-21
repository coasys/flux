#!/usr/bin/env sh

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    [ ! -d "./resources/linux" ] && mkdir "./resources/linux"
    [ -f "./resources/linux/holochain" ] && rm ./resources/linux/holochain
    cp `which holochain` ./resources/linux/
    [ -f "./resources/linux/lair-keystore" ] && rm ./resources/linux/lair-keystore
    cp `which lair-keystore` ./resources/linux/

elif [[ "$OSTYPE" == "darwin"* ]]; then
    [ ! -d "./resources/darwin" ] && mkdir "./resources/darwin"
    [ -f "./resources/darwin/holochain" ] && rm ./resources/darwin/holochain
    cp `which holochain` ./resources/darwin
    [ -f "./resources/darwin/holochain" ] && rm ./resources/darwin/lair-keystore
    cp `which lair-keystore` ./resources/darwin
    
else
    echo "Sorry your OS type is not supported"
fi