---
name: node-project-commands
description: How to run, build, test, lint, or serve a Node.js project with package.json. Use before running npm, yarn, pnpm, or node commands in a project, and when a command fails because of the Node version.
---

# Running Node project commands

The agent may run on a different Node version than the project. Project commands must run on the project's own Node version, through the project's own scripts.

## Before the first command

1. Read `package.json` and list its `scripts`.
2. Pick the package manager. The `packageManager` field in `package.json` decides. Without it, `yarn.lock` means yarn, `pnpm-lock.yaml` means pnpm, and `package-lock.json` means npm.
3. Find the expected Node version in the `volta` field of `package.json`, `.nvmrc`, `.node-version`, or `engines.node`.
4. Run `node -v` in the project folder and compare it with the expected version.

## Running commands

- Run tasks through their scripts, for example `yarn serve`, `yarn build`, `npm run build`, or `npm test`. Don't call webpack, vite, jest, or vue-cli-service directly when a script exists.
- Run commands from the folder that contains the `package.json`. In a monorepo, use the workspace commands the repo already uses.
- Use only the package manager from step 2. Don't run `npm install` in a yarn project.
- Install dependencies only when `node_modules` is missing or a command fails on a missing package. Don't change the lockfile unless the user asks. Use `yarn install --frozen-lockfile` for Yarn 1, `yarn install --immutable` for Yarn 2 and later, `npm ci` for npm, and `pnpm install --frozen-lockfile` for pnpm.

## Node version

- Don't edit the `volta` field, `.nvmrc`, `.node-version`, `engines`, or lockfiles to make a command work. Don't run `volta pin`.
- Don't force a version with `volta run --node`, `npx node@<version>`, or `nvm use <version>` with a version the project doesn't declare.
- If `node -v` matches the expected version or satisfies the `engines` range, run the command.
- If it doesn't match, the project has `.nvmrc`, and nvm is installed, load nvm in the same command: `. "${NVM_DIR:-$HOME/.nvm}/nvm.sh" && nvm use && yarn build`. This affects only that shell.
- Otherwise stop and report the expected and the active Node version. Don't run the command on the wrong version.

## Long-running scripts

`serve`, `dev`, `start`, and `watch` scripts don't exit. Running one in the foreground blocks the agent.

- Start it in the background with a log file: `yarn serve > /tmp/<project>-serve.log 2>&1 & echo $!`
- Wait a few seconds, then read the log for the URL or errors.
- When finished, stop it with `kill <pid>` unless the user wants it to keep running.
- If the port is already in use, report it. Don't kill processes you didn't start.

## Report

After running a command, state the command, the Node version it ran on, and the result.
