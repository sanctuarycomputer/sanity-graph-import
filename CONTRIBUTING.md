# Contributing

Thanks for your interest in making a contribution!


## Setup

To get started:

- Fork this repo
- Clone your fork: `git clone git@github.com:your-github-handle/sanity-graph-import`
- Install packages: `yarn install`
- Set up your test studio (required for running tests) `yarn test-studio:init`
- Set up tests: `yarn test:init` (TODO #7)

You will need to be logged into Sanity - if you haven't done this on your machine, run `npx @sanity/cli login`.

You'll now have a sample test studio under your account that you can use to try things out.

## Development

You can now run `yarn start` to compile on file changes and `yarn test:watch` to get the tests running.

Make changes, then commit them with a commit message that matches [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines. For example:

`git commit -m "fix(lib): fixes some bug"`
`git commit -m "chore(repo): update dependencies"`
`git commit -m "docs(repo): update contributors doc"`

The format of the message is `[type]([scope]): your message`

Where `scope` is one of:

- `lib`: changes to the library. You'll probably be using this one.
- `repo`: general changes to the repo that don't affect the code of the library (i.e. adding scripts, modifying configuration settings)

And `type` is one of:

- `fix`: You fixed a bug! This increments the patch version, i.e. `1.0.1` -> `1.0.2`
- `feat`: You added a new feature! This increments the minor version, i.e. `1.0.2` -> `1.1.0`
- `refactor`: You changed some internals on existing features, but the API has not changed
- `perf`: You enhanced performance
- `style`: You updated styles (not applicable to this project)
- `test`: You updated or added tests
- `build`: Updates to build scripts, etc
- `chore`: Housekeeping, such as updating dependencies or removing unused files
- `ci`: Updates to CI configuration

If your updates change the API of the package in a way where users will need to update their usage, include `BREAKING CHANGE` as the last line in your commit message. If you do this, be sure to add a note to [MIGRATING.md]('/MIGRATING.md')!


## Pull Requests

Make a pull request from your updated fork and ask for a review! We will add you to the list of contributors, or you can add yourself by commenting in the PR with: `@all-contributors please add @<your-username> for <contributions>`. See a list of contribution types [here](https://allcontributors.org/docs/en/emoji-key).

## Linking

If you want to test your changes on another project, you can do this with `yarn link`:

 - run `yarn link` from within this repository's directory
 - run `yarn link @sanctucompu/sanity-graph-import` within your other project
