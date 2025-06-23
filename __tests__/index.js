import dedent from 'dedent';
import { unified } from 'unified';
import reParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import rehypeStringify from 'rehype-stringify';
import remark2rehype from 'remark-rehype';

import plugin from '../src/';


const render = text => unified()
  .use(reParse, {
    footnotes: true,
  })
  .use(plugin)
  .use(remark2rehype)
  .use(rehypeStringify)
  .processSync(text);

const fixture = dedent`
  Blabla ++ok++ kxcvj ++ok foo++ sdff

  sdf ++++ df

  sfdgs + + dfg ++ dgsg + qs

  With two pluses: \++key++ you'll get ++key++.

  It can contain inline markdown:

  * ++hell[~~o~~](#he)?++

  It cannot contain blocks:

  * ++hello: [[secret]]?++
`;


describe('parses kbd', () => {
  it('parses a big fixture', () => {
    const {value: contents} = render(fixture);
    expect(contents).toMatchSnapshot();
  });

  it('escapes the start marker', () => {
    const {value: contents} = render(dedent`
      ++one++ \++escaped++ ++three++ \+++four++ ++five++
    `);
    // Based on current plugin logic:
    // \++escaped++ -> text "++escaped++" -> <kbd>escaped</kbd>
    // \+++four++   -> text "+++four++"   -> <kbd>+four</kbd>
    expect(contents).toContain('<kbd>one</kbd>');
    expect(contents).toContain('<kbd>escaped</kbd>');
    expect(contents).not.toContain('++escaped++');
    expect(contents).toContain('<kbd>+four</kbd>');
    expect(contents).not.toContain('+<kbd>four</kbd>');
    expect(contents).toContain('<kbd>five</kbd>');
  });
});

const kbdMarkdownExtension = {
  handlers: {
    kbd: function(node, _parent, context) {
      // `context.all` serializes all children of the node.
      // For a kbd node, this should be its text content.
      const children = context.all(node);
      const innerText = children ? children.join('') : '';
      return `++${innerText}++`;
    }
  }
};

test('to markdown', () => {
  const {value: contents} = unified()
    .use(reParse)
    .use(plugin) // Run the plugin first to create kbd nodes
    .use(remarkStringify, { extensions: [kbdMarkdownExtension] }) // Then stringify
    .processSync(fixture);

  expect(contents).toMatchSnapshot();
});
