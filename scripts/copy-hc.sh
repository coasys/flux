#!/bin/bash
[ ! -d "./resources" ] && mkdir "./resources"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    [ ! -d "./resources/linux" ] && mkdir "./resources/linux"
    [ -f "./resources/linux/holochain" ] && rm ./resources/linux/holochain
    cp `which holochain` ./resources/linux/ && echo "Copied Holochain to resources"
    [ -f "./resources/linux/lair-keystore" ] && rm ./resources/linux/lair-keystore
    cp `which lair-keystore` ./resources/linux/ && echo "Copied lair to resources"
    [ -f "./resources/linux/hc" ] && rm ./resources/linux/hc
    cp `which hc` ./resources/linux/ && echo "Copied hc to resources"

elif [[ "$OSTYPE" == "darwin"* ]]; then
    [ ! -d "./resources/darwin" ] && mkdir "./resources/darwin"
    [ -f "./resources/darwin/holochain" ] && rm ./resources/darwin/holochain
    cp `which holochain` ./resources/darwin && echo "Copied Holochain to resources"
    [ -f "./resources/darwin/lair-keystore" ] && rm ./resources/darwin/lair-keystore
    cp `which lair-keystore` ./resources/darwin && echo "Copied lair to resources"
    [ -f "./resources/darwin/hc" ] && rm ./resources/darwin/hc
    cp `which hc` ./resources/darwin/ && echo "Copied hc to resources"
    
else
    echo "Sorry your OS type is not supported"
fi