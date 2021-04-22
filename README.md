# Junto

## Environment
Node version: 14.16.0<br>
Linux OS for running HC & Holochain binaries (see `./resources`). Only linux is supported currently.

## Project setup
```
npm run build-languages && npm install
```

Also ensure that you have the following packages in the same directory that this repository is located in:<br>

[AD4M](https://github.com/perspect3vism/ad4m)<br>
[AD4M-core-executor](https://github.com/perspect3vism/ad4m-executor)<br>
[language-context](https://github.com/perspect3vism/language-context)<br>

(You will need to run `npm install && npm run build` in each of these also)

### Compiles and hot-reloads for development
```
npm run electron:serve
```

### Compiles and minifies for production
```
npm run electron:build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
