# remark-kbd-plus

This JS plugin for [remark][remark] parses custom Markdown syntax to handle keyboard keys in the format `++Cmd+Alt+M++` similar to used in the Python Markdown extension [pymdownx][pymdownx]. 

It adds a new node type to the [mdast][mdast] produced by [remark][remark]: `kbd`. While `pymdownx.keys` itemizes the single keys and allows creation of nested objects, `remark-kbd-plus` currently places the strings wrapped in `++` into one `kbd` node. If you are using [rehype][rehype], the stringified HTML result will be `<kbd>`.

## Syntax

```markdown
Hit ++Enter++ twice to create a new paragraph.
```

## AST (see [mdast][mdast] specification)

`Kbd` ([`Parent`][parent]) represents a reference to a user.

```javascript
interface Kbd <: Parent {
  type: "kbd";
}
```

For example, the following markdown:

`++Cmd+Alt+M++`

Yields:

```javascript
{
  type: 'kbd',
  children: [{
    type: 'text',
    value: 'Cmd+Alt+M'
  }]
}
```

## Rehype

This plugin is compatible with [rehype][rehype]. `Kbd` mdast nodes will become `<kbd>Cmd+Alt+M</kbd>`.

## Installation

[npm][npm]:

```bash
npm install remark-kbd-plus
```

## Usage

Dependencies:

```javascript
const unified = require('unified')
const remarkParse = require('remark-parse')
const stringify = require('rehype-stringify')
const remark2rehype = require('remark-rehype')

const remarkKbd = require('remark-kbd-plus')
```

Usage:

```javascript
unified()
  .use(remarkParse)
  .use(remarkKbd)
  .use(remark2rehype)
  .use(stringify)
```

## Changelog

- 2019-04-14 

## Copyright

[remark-kbd-plus][remark-kbd-plus] © 2019 [Adam Twardoch][adam]
Based on [remark-kbd][remark-kbd] © [Zeste de Savoir][zds]

## License

[MIT][license] 


<!-- Definitions -->

[remark-kbd-plus]: https://github.com/twardoch/remark-kbd-plus/

[remark-kbd]: https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-kbd

[adam]: https://twardoch.github.io/

[license]: https://github.com/twardoch/remark-kbd-plus/LICENSE

[zds]: https://zestedesavoir.com

[npm]: https://www.npmjs.com/package/remark-kbd-plus

[mdast]: https://github.com/syntax-tree/mdast/blob/master/readme.md

[pymdownx]: https://facelessuser.github.io/pymdown-extensions/extensions/keys/

[remark]: https://github.com/remarkjs/remark

[rehype]: https://github.com/rehypejs/rehype

[parent]: https://github.com/syntax-tree/unist#parent
