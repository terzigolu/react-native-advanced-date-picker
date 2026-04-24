# Contributing

Thanks for your interest in contributing! This project is a React Native date picker published to npm, and we try to keep the contribution flow lightweight.

## Before you start

- Browse [existing issues](https://github.com/terzigolu/react-native-advanced-date-picker/issues) to see if your idea / bug is already tracked.
- For anything larger than a small fix, please **open an issue first** to discuss the approach. This avoids wasted work.

## Development setup

Requirements:
- Node.js 18+ (20 LTS recommended)
- Yarn 1.x (this project uses yarn, not npm)
- macOS with Xcode for iOS testing; Android Studio for Android testing

```bash
git clone https://github.com/terzigolu/react-native-advanced-date-picker.git
cd react-native-advanced-date-picker
yarn install
```

Run the checks:

```bash
yarn typescript   # tsc --noEmit
yarn test         # jest (62 tests)
yarn build        # react-native-builder-bob → lib/commonjs + lib/module + lib/typescript
```

Manual testing: the repo ships a demo app under the sibling `DatePickerTestApp/` folder (see the README for how to run it on the iOS simulator).

## Making a change

1. **Fork** the repo and create a feature branch: `git checkout -b fix/range-band-clipping`
2. Make your change. Keep the diff focused — one logical change per PR.
3. **Run the checks** locally. PRs that fail `yarn typescript` or `yarn test` won't pass CI.
4. **Add tests** for new behaviour or bug fixes.
5. **Update docs** — README for new props or behaviour, CHANGELOG under `## [Unreleased]`.
6. Push and open a PR against `main`.

## PR guidelines

- Keep PRs small. If in doubt, split into multiple PRs.
- Commit messages should be descriptive: `fix: modal state no longer requires second tap` is fine; `wip` or `fix stuff` is not.
- If your change is user-visible, add a screenshot or GIF to the PR description.
- If your change is a breaking change, call it out explicitly — we will batch it into the next major version.
- CI must be green. If CI fails on something unrelated to your change, ping the maintainer.

## Non-breaking is the default

This is a published library. Most PRs should be non-breaking. Prefer **optional props with sensible defaults** over changing existing signatures. If you truly need a breaking change, open an issue first so we can discuss API design and schedule the major bump.

## Style

- TypeScript strict mode — no `any` (there's one legacy `any` in `DayCell.tsx` around RN `Animated` style unions, do not add more).
- Keep component signatures readable — prefer destructured props with default values over positional args.
- Match the existing formatting. There's no Prettier config yet; just keep the diff clean.

## Releasing (maintainer only)

```bash
# 1. Bump version
# edit package.json + CHANGELOG.md

# 2. Verify
yarn typescript && yarn test && yarn build
npm publish --dry-run

# 3. Commit + tag
git commit -am "chore: release X.Y.Z"
git tag vX.Y.Z
git push origin main --tags

# 4. Publish
npm publish --access public
```

`prepublishOnly` will re-run `yarn typescript && yarn test && yarn build` before the tarball is uploaded, as a last safety net.

## Questions?

Open a [GitHub Discussion](https://github.com/terzigolu/react-native-advanced-date-picker/discussions) (if enabled) or a regular issue. Thanks again for contributing!
