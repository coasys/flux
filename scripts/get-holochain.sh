#!/usr/bin/env sh
[ ! -d "./resources" ] && mkdir "./resources"
[ ! -d "./resources/temp" ] && mkdir "./resources/temp"

HOLOCHAIN_VER="d003eb7a45f1d7125c4701332202761721793d68"

echo "Getting holochain from GitHub"

[ ! -d "./resources/temp/lair" ] && git clone https://github.com/holochain/lair ./resources/temp/lair
[ ! -d "./resources/temp/holochain" ] && git clone https://github.com/holochain/holochain ./resources/temp/holochain

cd ./resources/temp/holochain && git checkout $HOLOCHAIN_VER