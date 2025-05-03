# Vue3-Starter

## Requirements

- [Bun](https://bun.sh) >= 1.0.0

## Copying this project

You can quickstart your project by [using this template](https://github.com/pathscale/vue3-starter/generate)

If you prefer the command line, you can install the template using [degit](https://github.com/Rich-Harris/degit)

    degit pathscale/vue3-starter vue3-starter

Alternatively you can use the old fashioned

    git clone https://github.com/pathscale/vue3-starter.git --depth 1

Copy dotenv file:

```shell
cp .env.example .env
```

## What's Included

- [Vue3-UI](https://github.com/pathscale/vue3-ui) and Bulma with css variables support
- Hot reload
- Linting with ESLint
- Javascript compiled and minified with google-closure-compiler
- CSS across all components extracted into a single file and minified
- Unused css removed with our [custom purger plugin](https://github.com/pathscale.com/rollup-plugin-vue3-ui-css-purge)

## Project setup

```bash
bun install
```

## Run development server with hot reload

```bash
bun run start
```

## Make production ready build, minified and purged

```bash
bun run build
```

## Scan your code for potential errors

```bash
bun run lint
```
## Generate DTOs from JSON schema

To generate DTOs (Data Transfer Objects) from a JSON schema, use the following command:

```
bun run schema
```

## Development Notes

- This project uses Bun as the package manager and runtime environment
- All commands should be run using `bun run` instead of `npm run`
- The project includes a `bun.lock` file for dependency management
