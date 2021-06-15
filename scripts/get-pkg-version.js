// Taken from here: https://github.com/Zettlr/Zettlr/blob/develop/scripts/get-pkg-version.js

const path = require('path')
console.log(require(path.join(__dirname, '../package.json')).version)