<h1 align="center">
  Flux UI
</h1>

> Flux UI provides front-end developers & engineers a collection of reusable web components to build Flux applications. Adopting the library enables developers to use consistent markup, styles, and behavior in prototype and production work.

📚 [Flux UI documentation is available here](https://docs.fluxsocial.io/)

### ⏩ tl;dr

```
npm install
npm run start
```

## 📚 Documentation

## Guidelines

- All components should do one thing, and do that thing well.
- Don't use Objects or Arrays as props for Web Components. Try to rethink the issue and see if you can make two elements like `select` and `option`. Read more about best practises [here](https://developers.google.com/web/fundamentals/web-components/best-practices)
- New functionality should be reviewed by at least one other person before going into Flux Elements.

## Contributing

## Development

To develop on the project, please first read our guidelines and the contributing section above.

_To add a new feature:_

- Create a new branch (`git checkout -b feature/branchname`)
- Work on your feature, and commit your changes
- Update the version number in the package.json file. You can read more about versioning below
- Create a pull request into the `development` branch and ask for a review

To modify an existing feature follow the same process, but also remember the versioning system. If there is a breaking change, or if this might impact existing sites using Flux Elements, update the version number. See below for details.

## Versioning

Flux Elements uses [semantic versioning](http://semver.org/) to make sure once a site starts using it, web components won't suddenly change and break the site. The version number is located in `package.json`

When a breaking change is added, a new major version is required.

### Publishing a new version on NPM

The `development` branch works as our `beta` branch, so we can try out new features before we roll them out into production.

_To publish a beta version:_

- Checkout to `development`
- Bump the package.json for example from `0.6.10-beta.9` to `0.6.10-beta.10`
- Run `npm publish --tag beta`

`master` is used as our production branch, so when publishing a new version, make sure you have tested all the new features, and taken into account breaking changes etc.

_To publish to production:_

- Checkout to `master`
- Bump the package.json for example from `0.6.9` to `0.6.10` depending on the types of changes
- Run `npm publish`

## 🔨 Hosting

The documentation is hosted on [Netlify](https://netlify.com). Each time code is pushed to the `master` branch, a new build of the documentation will be deployed. Netlify also creates a unique build per pull request so it's easy for other people to review and see the changes live.

Flux Elements is published on NPM and can be installed simply by running `npm install --save @coasys/flux-ui`. If you want to use a CDN, we reccommend that you use [JSDeliver](https://www.jsdelivr.com/).

## ⭐ Adding icons

## 🌐 Browser support

## 📂 Application structure

## Found a bug?

- If you've found a bug, you can create a new [issue](https://github.com/junto/ui/issues) via github.
- If you want to fix this issue yourself, do so and then follow the development guide above.

## 📦 Dependencies

We try to have as few dependencies as possible in Flux Elements. This makes it easier to maintain in the long run, and it makes it more secure as we are not using some unkown third party code in our projects.

- [LitElement](https://github.com/Polymer/lit-element) - A small web component library
- [Popper](https://popper.js.org/docs/v2/) - Library for tooltip positioning
