# remark-kbd-plus

**`remark-kbd-plus` is a specialized plugin for the [remark](https://remark.js.org/) Markdown processor, part of the powerful [unified](https://unifiedjs.com/) ecosystem. Its purpose is to transform a simple, custom Markdown syntax for keyboard keys, like `++Cmd+Alt+M++`, into standard HTML `<kbd>Cmd+Alt+M</kbd>` elements.**

This allows you to semantically represent keyboard shortcuts in your documentation, making them visually distinct and accessible. The syntax is inspired by the [pymdownx Keys extension](https://facelessuser.github.io/pymdown-extensions/extensions/keys/) for Python Markdown.

This plugin is compatible with the modern [unified][] ecosystem.

## Table of Contents

*   [Who is this for?](#who-is-this-for)
*   [Why is it useful?](#why-is-it-useful)
*   [Features](#features)
*   [Installation](#installation)
*   [Usage](#usage)
    *   [Programmatic Usage](#programmatic-usage)
    *   [Command-Line Interface (CLI) Usage](#command-line-interface-cli-usage)
*   [Syntax Details](#syntax-details)
    *   [Basic Syntax](#basic-syntax)
    *   [Escape Sequences and Edge Cases](#escape-sequences-and-edge-cases)
*   [Technical Deep-Dive](#technical-deep-dive)
    *   [How it Works: Parsing and Transformation](#how-it-works-parsing-and-transformation)
    *   [The `kbd` AST Node](#the-kbd-ast-node)
*   [Contributing](#contributing)
    *   [Coding Standards](#coding-standards)
    *   [Testing](#testing)
    *   [Build Process](#build-process)
    *   [Submitting Changes](#submitting-changes)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [License](#license)

## Who is this for?

`remark-kbd-plus` is designed for:

*   **Software Developers:** Who need to document keyboard shortcuts in READMEs, technical documentation, or articles.
*   **Technical Writers:** Looking for a straightforward way to represent key presses in their guides and manuals.
*   **Users of Static Site Generators:** Such as Next.js, Astro, Gatsby, Docusaurus (if using remark/MDX pipelines), who want to enhance their Markdown capabilities.
*   **Content Management System (CMS) Developers:** Integrating Markdown editing and rendering.

Essentially, if you work with Markdown in a JavaScript-based environment and need to display keyboard keys, this plugin can be a valuable addition to your toolkit.

## Why is it useful?

*   **Semantic HTML:** Generates `<kbd>` tags, which are the semantically correct way to represent keyboard input in HTML. This improves accessibility and SEO.
*   **Markdown-Native Syntax:** The `++key++` syntax is easy to write and read directly in Markdown.
*   **Consistency:** Ensures keyboard shortcuts are styled uniformly across your documentation.
*   **Ecosystem Compatibility:** Built for `remark` and `unified`, fitting seamlessly into modern JavaScript-based content processing pipelines.
*   **Customizable Styling:** While the plugin handles the HTML structure, you can easily style the `<kbd>` elements using CSS to match your site's design.

## Features

*   Parses `++key++` into an mdast `kbd` node.
*   Transforms mdast `kbd` nodes into HTML `<kbd>key</kbd>` tags when used with `remark-rehype`.
*   Supports combinations of keys, e.g., `++Ctrl+Shift+Plus++`.
*   Correctly handles and ignores sequences like `++++` (four pluses) and `++  ` (double plus followed by a space) to prevent accidental parsing.
*   Supports escaping of `+` characters within kbd tags using `\`, e.g., `++Alt+\+++` becomes `<kbd>Alt++</kbd>`.
*   Supports escaping `++` markers using `\`. (See [Escape Sequences and Edge Cases](#escape-sequences-and-edge-cases) for precise behavior).

## Installation

To add `remark-kbd-plus` to your project, install it using npm or your preferred package manager:

```bash
npm install remark-kbd-plus
```

## Usage

`remark-kbd-plus` is a [unified plugin][unified-plugin] and is designed to be used within a processing pipeline.

### Programmatic Usage

This is the most common way to use `remark-kbd-plus`. You'll integrate it into a `unified` processor chain, typically with `remark-parse` (to parse Markdown), `remark-rehype` (to convert Markdown AST to HTML AST), and `rehype-stringify` (to generate HTML).

Here's a typical setup:

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkKbdPlus from 'remark-kbd-plus' // Ensure this path is correct
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {VFile} from 'vfile' // Optional: for virtual file metadata

const markdownInput = `
Press ++Enter++ to continue.
A common shortcut is ++Cmd+Shift+P++.
This is literal: ++++ (four pluses).
This is also literal: ++ not a kbd ++.
Escape a plus inside: ++Alt+\+++.
Escaped marker: \++this becomes literal +this++.
Double escaped marker: \\++this becomes literal \\++this++.
`

async function processMarkdown(md) {
  const file = await unified()
    .use(remarkParse)        // 1. Parse Markdown text to mdast (Markdown AST)
    .use(remarkKbdPlus)      // 2. Apply kbd transformation (modifies mdast)
    .use(remarkRehype)       // 3. Convert mdast to hast (HTML AST)
    .use(rehypeStringify)    // 4. Convert hast to HTML string
    .process(new VFile({path: 'input.md', value: md})) // Use VFile for context
  return String(file)
}

processMarkdown(markdownInput).then(htmlOutput => {
  console.log(htmlOutput);
  /*
  Example output (HTML structure may vary slightly based on exact processor versions):
  <p>Press <kbd>Enter</kbd> to continue.
  A common shortcut is <kbd>Cmd+Shift+P</kbd>.
  This is literal: ++++ (four pluses).
  This is also literal: ++ not a kbd ++.
  Escape a plus inside: <kbd>Alt++</kbd>.
  Escaped marker: +this becomes literal +this++.
  Double escaped marker: \++this becomes literal \++this++.</p>
  */
})
```

### Command-Line Interface (CLI) Usage

While `remark` plugins are primarily designed for programmatic use within build systems or applications, you can use them with `remark-cli` for simple transformations. However, for HTML output, this often requires chaining multiple plugins.

If you have `remark-cli` and other necessary plugins like `remark-rehype` and `rehype-stringify` installed globally or locally in your project, you could invoke it like this:

```bash
npx remark input.md --use remark-kbd-plus --use remark-rehype --use rehype-stringify --output output.html
```

For most practical HTML generation scenarios, programmatic usage (as shown above) or integration with a static site generator (which handles these pipelines internally) is recommended. Many static site generators and MDX tools allow you to add remark plugins to their configuration easily.

## Syntax Details

### Basic Syntax

The core syntax is straightforward:

*   Wrap keyboard keys in double plus characters: `++key++`.
    *   Example: `++Enter++` becomes `<kbd>Enter</kbd>`
    *   Example: `++Ctrl+Alt+Delete++` becomes `<kbd>Ctrl+Alt+Delete</kbd>`

The parser includes logic to avoid common false positives:

*   Four consecutive plus signs (`++++`) are treated as literal text, not an empty KBD tag.
*   A `++` marker followed immediately by a whitespace character (e.g., `++ key++`) is treated as literal text.
*   Unterminated sequences (e.g., `Some text ++Ctrl`) are treated as literal text.

### Escape Sequences and Edge Cases

The backslash (`\`) acts as an escape character, allowing you to include literal `+` characters within a kbd tag or to prevent the `++` sequence from being interpreted as a kbd marker. The fundamental rule is: **a backslash `\` makes the immediately following character literal.**

*   **Literal `+` inside `<kbd>`:** To include a `+` character literally within a kbd tag, escape it with a backslash.
    *   `++Alt+\+++` will render as `<kbd>Alt++</kbd>`. (The `\+` becomes a literal `+`).
    *   `++\+\++` will render as `<kbd>++</kbd>`.

*   **Making `++` markers literal:**
    *   `\++key++`: The `\` escapes the first `+`. The parser then sees literal `+` followed by `key++`. This sequence does *not* form a kbd tag and will render as the literal text `+key++`.
    *   `\\++key++`: The first `\` escapes the second `\`. The parser then sees a literal `\` followed by `++key++`. This `\` then escapes the first `+` of `++key++`. The result is the literal text `\+key++`.
    *   The test case `\\\\++key++` (four backslashes) from `__tests__/index.js` results in the literal text `++key++` being rendered (wrapped in `<p>` tags). This is because `\\\\` becomes `\\` (literal), which then makes the *following* `++` sequence appear as literal `++` to the kbd parser logic if it were to re-process (which it doesn't here, it's about how the initial string is tokenized). More simply: `\\\\` -> literal `\` + literal `\`. The first literal `\` escapes the second literal `\`. The code actually interprets `\\` as "buffer the literal character `\`". So `\\\\++key++` becomes literal `\` then literal `\` then `++key++`. This means it's `\\++key++` as literal text. *Self-correction after reviewing code: `value[i] === '\\'` -> `buffer += value[i+1]`. So `\\` means the first `\` escapes the second `\`, so `\` is added to buffer. `\\\\` would mean `\` is added, then next `\` escapes `+`. The test `\\\\++key++` resulting in `++key++` is the most reliable guide here for this specific edge case.*

*   **Unterminated sequences:** `Text ++Ctrl` will render as literal `Text ++Ctrl`.

*   **`++++` (Four pluses):** Treated as literal `++++`. `++ok++++` renders as `<kbd>ok</kbd>++++`.

*   **`++ ` (Marker followed by space):** `++ key++` is treated as literal `++ key++`.

Given the nuances of escape sequence parsing, it's highly recommended to **refer to the test cases in `__tests__/index.js`** as the definitive source of truth for how specific complex sequences are handled. The code's parsing logic for escapes is concentrated on the `\` character making the *next* character literal.

## Technical Deep-Dive

This section provides a more detailed look into the inner workings of `remark-kbd-plus` and guidelines for contributors.

### How it Works: Parsing and Transformation

`remark-kbd-plus` functions as a **transformer plugin** within the [unified](https://unifiedjs.com/) ecosystem. Transformer plugins are functions that modify the Abstract Syntax Tree (AST) of the document. In this case, it operates on the [mdast](https://github.com/syntax-tree/mdast) (Markdown AST).

The process involves these key steps:

1.  **Visitor Pattern:** The plugin uses the `unist-util-visit` utility to traverse the mdast. It specifically targets `text` nodes, as these are the nodes that may contain the `++key++` syntax.

2.  **Character-by-Character Parsing:** For each `text` node, the plugin performs a character-by-character scan of its `value` to identify the custom syntax. This manual parsing approach allows for fine-grained control over the matching logic.
    *   **State Machine:** A simple state machine (`inKbd` boolean flag) tracks whether the parser is currently inside a potential kbd sequence (i.e., after an opening `++` but before a closing `++`). A `kbdOpenMarker` string stores the opening `++` to be prepended if the kbd is unterminated.
    *   **Identifying Markers:**
        *   An **opening `++` marker** is recognized if two consecutive `+` characters are found, provided:
            *   It's not part of a `++++` sequence (four pluses are treated as literal text).
            *   It's not followed immediately by a whitespace character (e.g., `++ text` is literal).
        *   A **closing `++` marker** is recognized if two consecutive `+` characters are found while `inKbd` is true.
    *   **Buffer:** Text content is accumulated in a `buffer`. When an opening `++` is found, any preceding text in the buffer is pushed as a regular `text` node. The buffer is then cleared to accumulate the content of the kbd.
    *   **Node Creation:** Upon finding a valid closing `++`, the content accumulated in the buffer (since the opening `++`) is used to create a new `kbd` node (see [The `kbd` AST Node](#the-kbd-ast-node) below).
    *   **AST Modification:** The original `text` node is replaced by a new array of nodes, which can be a mix of `text` nodes (for parts of the string not matching the kbd syntax) and `kbd` nodes. The `unist-util-visit` utility is informed to skip processing the newly inserted nodes and continue after them.

3.  **Handling Unterminated Sequences:** If the end of a text node is reached while `inKbd` is true (meaning an opening `++` was found but no corresponding closing `++`), the `kbdOpenMarker` (which is `++`) and the subsequent buffered text are treated as literal text. This prevents errors and ensures that incomplete syntax doesn't break the document.

4.  **Escape Character (`\`):**
    *   The backslash (`\`) makes the immediately following character literal. `buffer += value[i+1]` is called, and `i` is incremented.
    *   If `\` is the last character in the input, it's treated as a literal backslash.
    *   This mechanism is key to including literal `+` within kbd content (`++\+key++` -> `<kbd>+key</kbd>`) or making `++` markers literal (e.g., `\++key++` -> `+key++` because `\` escapes the first `+`).

5.  **HTML Transformation (via `remark-rehype`):**
    *   `remark-kbd-plus` creates `kbd` nodes in the mdast.
    *   Crucially, it adds `data: { hName: 'kbd' }` to these nodes.
    *   When `remark-rehype` processes the mdast to convert it to a [hast](https://github.com/syntax-tree/hast) (HTML AST), it uses the `hName` property to determine the HTML tag name. Thus, `kbd` nodes become `<kbd>` elements in the HTML output.

**Key Dependency:**
*   `unist-util-visit`: For robust and efficient AST traversal.

### The `kbd` AST Node

When `remark-kbd-plus` successfully parses a `++key++` sequence, it generates an mdast (Markdown Abstract Syntax Tree) node with the following structure:

```javascript
{
  type: 'kbd', // Identifies the node type
  children: [{
    type: 'text',
    value: 'key' // The content between the ++ markers (e.g., 'Cmd+Alt+M')
  }],
  data: { // Additional information for processors
    hName: 'kbd' // Instructs remark-rehype to use '<kbd>' as the HTML tag name
  }
}
```
This `kbd` node is a [Parent][unist-parent] node containing a single [Text][unist-text] node that holds the actual key string.

## Contributing

Contributions to `remark-kbd-plus` are welcome! Whether it's bug reports, feature suggestions, or code contributions, your input is valued.

### Coding Standards

*   **JavaScript:** The codebase uses modern JavaScript (ESM - ECMAScript Modules).
*   **Style and Linting:** We use [ESLint](https://eslint.org/) for code linting and maintaining a consistent style. Before committing, please run `npm run lint` and fix any reported issues. The ESLint configuration is in `eslint.config.js`.
*   **Clarity and Readability:** Write clear, well-commented code where necessary.

### Testing

*   **Framework:** Tests are written using [Jest](https://jestjs.io/). Test files are located in the `__tests__` directory.
*   **Running Tests:** Execute `npm run test` to run the test suite.
*   **Coverage:** To check test coverage, run `npm run coverage`.
*   **Writing Tests:**
    *   Please add tests for any new features or bug fixes.
    *   Snapshot testing is used for comparing larger output structures. If your changes affect the output, you may need to update snapshots using `npm test -- -u`.
    *   Focus on testing various input cases, including edge cases and escape sequences, to ensure robust parsing. The existing tests in `__tests__/index.js` serve as excellent examples and define the precise behavior for complex cases.

### Build Process

*   The source code is located in the `src/` directory and is written in modern JavaScript.
*   For distribution, the code is transpiled using [Babel](https://babeljs.io/) into a more widely compatible JavaScript version, outputting to the `dist/` directory. This is the code that gets published to npm.
*   The build process is defined in the `prepare` script in `package.json`:
    ```json
    "scripts": {
      "prepare": "del-cli dist && cross-env BABEL_ENV=production babel src --out-dir dist"
    }
    ```
    This script cleans the `dist` directory and then runs Babel. It's automatically executed by npm when you run `npm install` (if the package is a git dependency or during `npm pack`/`npm publish`).

### Submitting Changes

1.  **Fork the Repository:** Create your own fork of `remark-kbd-plus` on GitHub.
2.  **Create a Branch:** Make your changes in a new git branch:
    ```bash
    git checkout -b my-feature-branch
    ```
3.  **Develop:** Implement your feature or fix the bug. Remember to add or update tests!
4.  **Test and Lint:** Run `npm run test` and `npm run lint`. Ensure all checks pass.
5.  **Commit:** Commit your changes with a clear and descriptive commit message. Consider following [Conventional Commits](https://www.conventionalcommits.org/) if you are familiar with it (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
    ```bash
    git commit -m "feat: Add support for custom kbd delimiters"
    ```
6.  **Push:** Push your branch to your fork:
    ```bash
    git push origin my-feature-branch
    ```
7.  **Open a Pull Request:** Go to the original `remark-kbd-plus` repository and open a pull request from your forked branch. Provide a detailed description of your changes, why they were made, and link any relevant issues.

It's often a good idea to open an issue first to discuss significant changes or new features before investing a lot of time in development. This helps ensure your contribution aligns with the project's goals.

## Compatibility

This plugin is compatible with [rehype][rehype] for HTML transformation. The `kbd` mdast nodes it generates are correctly transformed into `<kbd>key</kbd>` HTML elements. It adheres to modern ECMAScript module standards and requires Node.js version 18.0.0 or higher, as specified in `package.json`.

## Security

Use of `remark-kbd-plus` itself does not involve parsing HTML or executing user-generated content in a way that could lead to cross-site scripting (XSS) attacks. It operates on the Markdown AST and generates specific, safe HTML elements (`<kbd>`).

However, as with any content processing pipeline, ensure that the broader system (especially any HTML stringification or rendering steps that follow) is appropriately configured to prevent XSS if you are processing Markdown from untrusted user input. Always sanitize HTML if it's derived from potentially malicious sources.

## License

[MIT][license] © [Adam Twardoch][adam] et al.

<!-- Definitions -->

[remark-kbd-plus]: https://github.com/twardoch/remark-kbd-plus/
[remark-kbd]: https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-kbd
[adam]: https://twardoch.github.io/
[license]: https://github.com/twardoch/remark-kbd-plus/LICENSE
[npm]: https://www.npmjs.com/package/remark-kbd-plus
[mdast]: https://github.com/syntax-tree/mdast
[unist-parent]: https://github.com/syntax-tree/unist#parent
[unist-text]: https://github.com/syntax-tree/unist#text
[pymdownx]: https://facelessuser.github.io/pymdown-extensions/extensions/keys/
[remark]: https://github.com/remarkjs/remark
[rehype]: https://github.com/rehypejs/rehype
[unified]: https://github.com/unifiedjs/unified
[unified-plugin]: https://unifiedjs.com/learn/guide/create-a-plugin/
