#!/usr/bin/env sh
[ ! -d "./resources" ] && mkdir "./resources"
[ ! -d "./resources/temp" ] && mkdir "./resources/temp"

HOLOCHAIN_VER="221f3424a919224dcf1950d1059e8b88aba08f7b"

echo "Getting holochain from GitHub"

[ ! -d "./resources/temp/lair" ] && git clone https://github.com/holochain/lair ./resources/temp/lair
[ ! -d "./resources/temp/holochain" ] && git clone https://github.com/holochain/holochain ./resources/temp/holochain

cd ./resources/temp/holochain && git checkout $HOLOCHAIN_VER