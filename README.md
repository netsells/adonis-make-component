# @netsells/adonis-make-component

This package contains an Adonis provider to provider a `make:component` component. This command allows you to quickly bootstrap Component, Unit Test and Storybook files.

## Installation

```sh
$ yarn add @netsells/adonis-make-component
```

Add the provider to your `start/app.js`:

```js
const aceProviders = [
    '@netsells/adonis-make-component/providers/CommandProvider',
];
```

## Usage

Run the command using ace:

```sh
$ node ace make:component <path>
```

`path` is the to the component from the root directory, for example, to bootstrap an `ArticleCard` component you would run:

```sh
$ node ace make:component resources/components/cards/ArticleCard
```

The command will then guide you through the bootstrapping process.

