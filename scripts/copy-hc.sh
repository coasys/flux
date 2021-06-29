#!/usr/bin/env sh
[ ! -d "./resources" ] && mkdir "./resources"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    [ ! -d "./resources/linux" ] && mkdir "./resources/linux"
    [ -f "./resources/linux/holochain" ] && rm ./resources/linux/holochain
    cp `which holochain` ./resources/linux/
    [ -f "./resources/linux/lair-keystore" ] && rm ./resources/linux/lair-keystore
    cp `which lair-keystore` ./resources/linux/
    [ -f "./resources/linux/hc" ] && rm ./resources/linux/hc
    cp `which hc` ./resources/linux/

elif [[ "$OSTYPE" == "darwin"* ]]; then
    [ ! -d "./resources/darwin" ] && mkdir "./resources/darwin"
    [ -f "./resources/darwin/holochain" ] && rm ./resources/darwin/holochain
    cp `which holochain` ./resources/darwin
    [ -f "./resources/darwin/lair-keystore" ] && rm ./resources/darwin/lair-keystore
    cp `which lair-keystore` ./resources/darwin
    [ -f "./resources/darwin/hc" ] && rm ./resources/darwin/hc
    cp `which hc` ./resources/darwin/
    
else
    echo "Sorry your OS type is not supported"
fi