# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.20] - 2024-07-30

### Added
- Comprehensive JSDoc comments for main functions and internal helpers in `src/index.js`.
- New granular test suite `handles various edge cases for escapes and markers` in `__tests__/index.js` for better coverage of specific parsing scenarios.
- `PLAN.md` detailing the refactoring and streamlining process.
- `TODO.md` for tracking task completion.

### Changed
- **Breaking Change**: Overhauled parser logic in `src/index.js` to correctly and consistently handle `\` escape characters.
    - `\++key++` now renders as literal `++key++` (previously might have become `<kbd>key</kbd>`).
    - `\+++key++` now renders as literal `+` followed by `<kbd>key</kbd>` (previously might have become `<kbd>+four</kbd>` or similar, depending on context).
    - `++\+key++` now renders as `<kbd>+key</kbd>`.
- Updated all tests in `__tests__/index.js` to align with the new escape handling logic. Snapshots for `parses a big fixture`, `correctly handles escaped markers and content` (formerly `escapes the start marker`), and `to markdown conversion` will require updates.
- The main `fixture` in tests was slightly adjusted due to the changed behavior of `\++key++`.
- Inlined the `is-whitespace-character` dependency into `src/index.js` as a local helper function to reduce external dependencies.
- Corrected `package.json`: moved `unist-util-visit` from `devDependencies` to `dependencies` as it's a direct production dependency.
- Improved inline comments in the parsing loop in `src/index.js` for better clarity.

### Removed
- Removed the `is-whitespace-character` dependency from `package.json`.

### Fixed
- Corrected placement of `unist-util-visit` to be a production dependency.
- Ensured consistent behavior for edge cases like `++++` (literal), `++ ` (literal), and unterminated `++key` sequences (literal).Tool output for `create_file_with_block`:
