import dedent from 'dedent';
import { unified } from 'unified';
import reParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import rehypeStringify from 'rehype-stringify';
import remark2rehype from 'remark-rehype';

import plugin from '../src/';


const render = text => unified()
  .use(reParse, {
    footnotes: true, // Keep existing options
  })
  .use(plugin)
  .use(remark2rehype)
  .use(rehypeStringify)
  .processSync(text);

// Fixture updated to reflect new escape handling for \++key++
const fixture = dedent`
  Blabla ++ok++ kxcvj ++ok foo++ sdff

  sdf ++++ df

  sfdgs + + dfg ++ dgsg + qs

  With two pluses: ++key++ you'll get ++key++.

  It can contain inline markdown:

  * ++hell[~~o~~](#he)?++

  It cannot contain blocks:

  * ++hello: [[secret]]?++
`;
// Note: The line "With two pluses: \++key++ you'll get ++key++." in original fixture
// will now render as "With two pluses: ++key++ you'll get <kbd>key</kbd>."
// So, to keep the visual test of "++key++" becoming kbd, I removed the backslash.
// If the intent was to test \++key++ becoming literal, that's covered in specific escape tests.

describe('parses kbd', () => {
  it('parses a big fixture', () => {
    const { value: contents } = render(fixture);
    expect(contents).toMatchSnapshot();
  });

  it('correctly handles escaped markers and content', () => {
    const text = dedent`
      ++one++ \++escaped++ ++three++ \+++four++ ++five++ \\++six++ ++\\+seven++
    `;
    const { value: contents } = render(text);

    // ++one++ -> <kbd>one</kbd>
    expect(contents).toContain('<kbd>one</kbd>');

    // \++escaped++ -> ++escaped++ (literal)
    expect(contents).toContain('++escaped++');
    expect(contents).not.toContain('<kbd>escaped</kbd>');

    // ++three++ -> <kbd>three</kbd>
    expect(contents).toContain('<kbd>three</kbd>');

    // \+++four++ -> +<kbd>four</kbd>
    expect(contents).toContain('+<kbd>four</kbd>');
    expect(contents).not.toContain('<kbd>+four</kbd>'); // important distinction

    // ++five++ -> <kbd>five</kbd>
    expect(contents).toContain('<kbd>five</kbd>');

    // \\++six++ -> \<kbd>six</kbd> (literal backslash, then kbd for ++six++)
    expect(contents).toContain('\\<kbd>six</kbd>');

    // ++\+seven++ -> <kbd>+seven</kbd> (kbd with an escaped plus inside)
    expect(contents).toContain('<kbd>+seven</kbd>');

    expect(contents).toMatchSnapshot(); // Add snapshot for this specific test
  });

  it('handles various edge cases for escapes and markers', () => {
    const testCases = {
      // Basic escapes
      'escaped plus prefix: \\++key++': '++key++',
      'escaped kbd with content: ++\\+key++': '<p><kbd>+key</kbd></p>',
      'literal backslash then kbd: \\\\++key++': '<p>\\<kbd>key</kbd></p>',
      // Triple plus
      'escaped triple plus: \\+++key++': '<p>+<kbd>key</kbd></p>',
      'literal triple plus: +++key++': '<p>+<kbd>key</kbd></p>', // + literal, then <kbd>key</kbd>
      // Quad plus
      // \++++key++ -> \+ (escaped +) then ++ (+key) ++ -> +<kbd>+key</kbd>
      'escaped quad plus: \\++++key++': '<p>+<kbd>+key</kbd></p>',
      // ++++key++ -> ++++ (literal) then key++ (literal) -> ++++key++
      'literal quad plus: ++++key++': '<p>++++key++</p>',
      'literal quad plus followed by kbd: ++++ ++key++': '<p>++++ <kbd>key</kbd></p>',


      // Unterminated sequences
      'unterminated kbd: ++key': '<p>++key</p>',
      'unterminated kbd with escape: ++key\\++': '<p>++key++</p>', // \+ makes the last + literal
      'escaped unterminated kbd: \\++key': '<p>++key</p>',

      // Whitespace rules
      'kbd with space: ++ ++': '<p><kbd> </kbd></p>',
      'marker followed by space: ++ key++': '<p>++ key++</p>', // Not a kbd
      'marker with leading space:  ++key++': '<p> <kbd>key</kbd></p>', // Space is preserved

      // Empty kbd
      'empty kbd: ++++': '<p>++++</p>', // Treated as literal based on ++++ rule
      'empty kbd explicit: ++ ++': '<p><kbd> </kbd></p>', // This allows kbd with just space
      // 'empty kbd true: ++""++': '<p><kbd></kbd></p>', // This is not possible with current syntax as "" is not between ++
      'really empty kbd: ++++': '<p>++++</p>', // this is the actual "empty" ++ ++ case, which is ++++
      'adjacent empty kbd: ++ok++++': '<p><kbd>ok</kbd>++++</p>', // Ok, then literal ++++
    };

    for (const [input, expectedHtmlFragment] of Object.entries(testCases)) {
      const { value: contents } = render(input);
      // For fragments, we expect them to be wrapped in <p> by default by remark/rehype
      if (expectedHtmlFragment.startsWith('<p>')) {
        expect(contents).toBe(expectedHtmlFragment);
      } else {
        expect(contents).toBe(`<p>${expectedHtmlFragment}</p>`);
      }
    }
  });
});

const kbdMarkdownExtension = {
  handlers: {
    kbd: function(node, _parent, context) {
      const children = context.all(node);
      const innerText = children ? children.join('') : '';
      // When stringifying, we don't re-introduce escapes from kbd content
      // remark-stringify handles escaping of special markdown characters in text if needed.
      return `++${innerText}++`;
    }
  }
};

test('to markdown conversion', () => {
  // Use a specific fixture for this to better control what's tested for stringification
  const mdFixture = dedent`
    This is ++Ctrl++ + ++Alt++ + ++Delete++.
    And this is literal \++escaped++.
    Also, \+++complex escape++.
    And \\++actual backslash kbd++.
    Finally, ++content with \+ plus++.
  `;
  const { value: htmlOutput } = render(mdFixture); // First, see HTML output
  const { value: markdownOutput } = unified()
    .use(reParse)
    .use(plugin)
    .use(remarkStringify, { extensions: [kbdMarkdownExtension] })
    .processSync(mdFixture);

  // HTML check for key parts (optional, but good for sanity)
  expect(htmlOutput).toContain('<kbd>Ctrl</kbd>');
  expect(htmlOutput).toContain('<kbd>Alt</kbd>');
  expect(htmlOutput).toContain('<kbd>Delete</kbd>');
  expect(htmlOutput).toContain('literal ++escaped++');
  expect(htmlOutput).toContain('+<kbd>complex escape</kbd>'); // \+++ -> +<kbd>
  expect(htmlOutput).toContain('\\<kbd>actual backslash kbd</kbd>'); // \\ -> literal \, then kbd
  expect(htmlOutput).toContain('<kbd>+ plus</kbd>'); // ++\+ plus++ -> <kbd>+ plus</kbd>

  // The primary check: does it stringify back correctly?
  // Escaped sequences in the original markdown that became literal text
  // should remain literal text. KBD nodes should become ++kbd content++.
  const expectedMd = dedent`
    This is ++Ctrl++ + ++Alt++ + ++Delete++.
    And this is literal ++escaped++.
    Also, +++complex escape++.
    And \\++actual backslash kbd++.
    Finally, ++content with + plus++.
  `;
  // Note: The stringifier will aim for the "source" but may normalize some things.
  // E.g. \+++complex escape++ (source) -> AST (text:"+", kbd:"complex escape") -> stringified "+++complex escape++"
  // This is because the kbd node just has "complex escape". The preceding "+" is a separate text node.
  // The kbdMarkdownExtension then wraps it with ++.
  // So the stringifier might produce "+++complex escape++" which is fine.

  // The stringifier should output the logical representation.
  // \++escaped++ became literal "++escaped++". So it stays that way.
  // \+++complex escape++ became literal "+" and KBD "complex escape". So stringifies to "+ ++complex escape++"
  // \\++actual backslash kbd++ became literal "\" and KBD "actual backslash kbd". So stringifies to "\ ++actual backslash kbd++"
  // ++\+ plus++ became KBD "+ plus". So stringifies to "++++ plus++"

  // Let's re-evaluate expectedMd based on how AST is built and stringified:
  const expectedMdAfterProcessing = dedent`
    This is ++Ctrl++ + ++Alt++ + ++Delete++.
    And this is literal ++escaped++.
    Also, +++complex escape++.
    And \\++actual backslash kbd++.
    Finally, ++++ plus++.
  `;

  expect(markdownOutput).toBe(expectedMdAfterProcessing);
  expect(markdownOutput).toMatchSnapshot(); // Snapshot for the stringified output
});
