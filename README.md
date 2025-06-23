# remark-kbd-plus

A [remark][remark] plugin to parse Markdown syntax for keyboard keys like `++Cmd+Alt+M++`, transforming them into `kbd` elements in HTML. This syntax is similar to that used in the Python Markdown extension [pymdownx][pymdownx].

This plugin is compatible with the modern [unified][] ecosystem.

## Features

- Parses `++key++` into an mdast `kbd` node.
- Supports multiple `+` characters within the keys, e.g., `++Ctrl+Shift+Plus++`.
- Correctly ignores `++++` (four pluses) and `++ followed by whitespace ++`.
- Integrates with [rehype][] to output `<kbd>key</kbd>` HTML tags.

## When to use this

If you're writing Markdown and need a simple way to represent keyboard shortcuts that should be semantically correct in HTML (as `<kbd>` elements), this plugin is for you.

## Installation

[npm][npm]:

```bash
npm install remark-kbd-plus
```

## Usage

Here's an example of how to use `remark-kbd-plus` with `unified`, `remark-parse`, `remark-rehype`, and `rehype-stringify` to convert Markdown to HTML:

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkKbdPlus from 'remark-kbd-plus' // Ensure this path is correct if using locally
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {VFile} from 'vfile' // For creating a virtual file

const markdownInput = `
Press ++Enter++ to continue.
Shortcut: ++Cmd+Shift+P++.
Avoid: ++++this++++.
Avoid: ++ this ++.
Escaped: \++EscapedKey++ should not be a kbd.
Complex escape: \+++Ctrl+S++ should be a literal + and then <kbd>Ctrl+S</kbd>.
`

async function processMarkdown(md) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkKbdPlus)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(new VFile({path: 'input.md', value: md}))
  return String(file)
}

processMarkdown(markdownInput).then(htmlOutput => {
  console.log(htmlOutput)
  /*
  Expected output (may vary slightly based on exact processor versions):
  <p>Press <kbd>Enter</kbd> to continue.
  Shortcut: <kbd>Cmd+Shift+P</kbd>.
  Avoid: ++++this++++.
  Avoid: ++ this ++.
  Escaped: +EscapedKey++ should not be a kbd.
  Complex escape: +<kbd>Ctrl+S</kbd> should be a literal + and then <kbd>Ctrl+S</kbd>.</p>
  */
})
```

## Syntax

Keyboard keys are represented by wrapping them in double plus characters:

```markdown
Hit ++Enter++ to create a new paragraph.
Use ++Ctrl+Alt+Delete++ to reboot.
```

## AST (Abstract Syntax Tree)

This plugin adds a `kbd` node type to the [mdast][mdast] syntax tree. The `kbd` node is a [Parent][unist-parent] node containing a single [Text][unist-text] node with the key's content.

For example, the Markdown `++Cmd+Alt+M++` yields the following mdast structure:

```javascript
{
  type: 'kbd',
  children: [{
    type: 'text',
    value: 'Cmd+Alt+M'
  }],
  data: {
    hName: 'kbd' // Used by remark-rehype to transform to <kbd>
  }
}
```

## API

This package exports a standard [unified plugin][unified-plugin].

### `remarkKbdPlus(options?)`

Configures the plugin. There are currently no options.

## Compatibility

This plugin is compatible with [rehype][rehype]. The `kbd` mdast nodes are transformed into `<kbd>Cmd+Alt+M</kbd>` HTML elements.
It adheres to modern ECMAScript module standards.

## Known Issues

-   **Complex Escape Sequences**: The handling of complex or ambiguous sequences involving backslashes (`\`) and multiple plus characters (`+`) might not always align with intuitive expectations or specific edge cases from other Markdown flavors. For example, the test for `\+++Ctrl+S++` expecting `+<kbd>Ctrl+S</kbd>` currently fails (see `__tests__/index.js`). Basic `++key++` and `\++key++` (resulting in `+key++`) work as expected.

## Security

Use of `remark-kbd-plus` does not involve parsing HTML or user-generated content that could lead to cross-site scripting (XSS) attacks, as it operates on the Markdown AST and generates specific, safe HTML elements. Always ensure that the broader processing pipeline (especially any HTML stringification or rendering steps) is appropriately configured to prevent XSS if user-provided Markdown is being processed.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

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
```
