#!/usr/bin/env sh
[ ! -d "./resources" ] && mkdir "./resources"
[ ! -d "./resources/temp" ] && mkdir "./resources/temp"

HOLOCHAIN_VER="b94acf0e250560957f404541673e809ac6a2b2ea"

echo "Getting holochain from GitHub"

[ ! -d "./resources/temp/lair" ] && git clone https://github.com/holochain/lair ./resources/temp/lair
[ ! -d "./resources/temp/holochain" ] && git clone https://github.com/holochain/holochain ./resources/temp/holochain

cd ./resources/temp/holochain && git checkout $HOLOCHAIN_VER