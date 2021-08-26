#!/usr/bin/env sh
[ ! -d "./resources" ] && mkdir "./resources"
[ ! -d "./resources/temp" ] && mkdir "./resources/temp"

HOLOCHAIN_VER="f3d17d993ad8d988402cc01d73a0095484efbabb"
LAIR_VERSION="6a9aab37c90566328c13c4d048d1afaf75fc39a9"

echo "Getting holochain from GitHub"

[ ! -d "./resources/temp/lair" ] && git clone https://github.com/holochain/lair ./resources/temp/lair
[ ! -d "./resources/temp/holochain" ] && git clone https://github.com/holochain/holochain ./resources/temp/holochain

cd ./resources/temp/holochain && git checkout $HOLOCHAIN_VER
cd ../temp/lair && git checkout $LAIR_VERSION