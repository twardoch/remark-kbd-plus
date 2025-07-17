import { visit } from 'unist-util-visit';

// const DOUBLE_PLUS = '++'; // Not strictly needed as we check char by char

// Inlined version of is-whitespace-character for checking whitespace.
// Consider it equivalent to the former `is-whitespace-character` dependency.
/**
 * Checks if a character is a whitespace character.
 * @param {string} character The character to check.
 * @returns {boolean} True if the character is whitespace, false otherwise.
 */
function isWhitespace(character) {
  // Ensure character is a string and then test against regex for whitespace.
  return typeof character === 'string' && /\s/.test(character);
}

/**
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * A remark plugin to transform text like '++Ctrl++' into kbd elements.
 *
 * This plugin processes text nodes, looking for sequences delimited by '++'.
 * It handles:
 * - Basic sequences: `++key++` becomes `<kbd>key</kbd>`.
 * - Escaping: `\++key++` becomes literal `++key++`. `++\+key++` becomes `<kbd>+key</kbd>`.
 * - Edge cases:
 *   - `++++` is treated as literal "++++".
 *   - `++ ` (marker followed by space) is treated as literal "++".
 *   - Unterminated sequences like `++key` are treated as literal `++key`.
 *
 * @param {Record<string, unknown>} [_options] Configuration options (currently unused).
 * @returns {(tree: UnistNode, file: VFile) => void} The transformer function.
 */
export default function remarkKbdPlus(_options = {}) {
  /**
   * Transforms the Unist tree by finding and replacing '++key++' sequences.
   * @param {UnistNode} tree The Unist tree to transform.
   * @param {VFile} _file The VFile associated with the tree (currently unused).
   */
  return function transformer(tree, _file) {
    visit(tree, 'text', (node, index, parent) => {
      // Standard visitor pattern checks
      if (!parent || typeof index !== 'number' || node.type !== 'text') {
        return;
      }

      const value = /** @type {string} */ (node.value);
      // Optimization: If '+' is not in the string, no '++' markers can exist.
      // Backslashes are also relevant for escapes, but '+' is the primary trigger.
      if (!value.includes('+')) {
        return;
      }

      const newNodes = [];
      let buffer = ''; // Accumulates characters for the current segment (text or kbd content)
      let inKbd = false; // True if we are currently parsing inside ++...++
      // Stores the opening "++" characters if inKbd is true.
      // This is used to reconstruct literal text if a KBD sequence is unterminated.
      let kbdOpenMarker = '';

      for (let i = 0; i < value.length; i++) {
        // 1. Handle escape character '\'
        // If a backslash is encountered, the next character is treated literally.
        if (value[i] === '\\') {
          if (i + 1 < value.length) {
            buffer += value[i + 1]; // Append the escaped character to the buffer
            i++; // Increment i to skip the escaped character in the next iteration
          } else {
            // This is a trailing backslash. Add it to the buffer as is.
            buffer += '\\';
          }
          continue; // Move to the next character
        }

        // 2. Check for '++' marker
        // This occurs if the current character and the next character are both '+'
        if (value[i] === '+' && value[i + 1] === '+') {
          if (!inKbd) { // ---- Currently NOT in KBD: Looking for an OPENING ++ ----
            // Potential opening '++' found.

            // Case A: Avoid '++++' (four pluses) from being treated as nested or empty KBD.
            // If '++++' is found, treat it as literal text "++++".
            if (value[i + 2] === '+' && value[i + 3] === '+') {
              buffer += '++++';
              i += 3; // Advance i past the "++++" sequence
              continue;
            }

            // Case B: Avoid '++' followed by whitespace (e.g., "++ key") from opening a KBD.
            // Such sequences are treated as literal "++".
            if (isWhitespace(value.charAt(i + 2))) {
              buffer += '++';
              i += 1; // Advance i past this "++" (loop's i++ will handle the second '+')
              continue;
            }

            // --- Valid OPENING "++" found ---
            // If there's any text accumulated in the buffer before this '++',
            // push it as a text node.
            if (buffer.length > 0) {
              newNodes.push({ type: 'text', value: buffer });
            }
            buffer = ''; // Reset buffer for the KBD content.
            inKbd = true; // Set state to indicate we are now inside a KBD.
            kbdOpenMarker = '++'; // Record the marker characters.
            i += 1; // Advance i past the "++" sequence.
          } else { // ---- Currently IN KBD: Looking for a CLOSING ++ ----
            // --- Valid CLOSING "++" found ---
            // Create a KBD node with the accumulated buffer as its content.
            newNodes.push({
              type: 'kbd',
              children: [{ type: 'text', value: buffer }],
              data: { hName: 'kbd' }, // Data for HTML transformation (rehype)
            });
            buffer = ''; // Reset buffer for any text that might follow the KBD.
            inKbd = false; // Set state to indicate we are no longer in a KBD.
            kbdOpenMarker = ''; // Clear the recorded opening marker.
            i += 1; // Advance i past the "++" sequence.
          }
        } else {
          // 3. Regular character (not '\' and not part of '++' marker)
          // Add the character to the current buffer.
          buffer += value[i];
        }
      }

      // After the loop, handle any remaining state.
      if (inKbd) {
        // Unterminated KBD sequence (e.g., "text ++kbd" without a closing "++").
        // The opening '++' and the content that was thought to be KBD content
        // should be treated as literal text.
        const remainingText = kbdOpenMarker + buffer;
        if (remainingText.length > 0) {
          // If the last node added was a text node, append to it.
          // Otherwise, create a new text node.
          if (newNodes.length > 0 && newNodes[newNodes.length - 1].type === 'text') {
            newNodes[newNodes.length - 1].value += remainingText;
          } else {
            newNodes.push({ type: 'text', value: remainingText });
          }
        }
      } else {
        // Loop finished, and not in an unterminated KBD.
        // Add any remaining text from the buffer (e.g., text after the last KBD).
        if (buffer.length > 0) {
          newNodes.push({ type: 'text', value: buffer });
        }
      }

      // Only replace the original node if actual changes were made.
      // Changes are made if newNodes has more than one entry, or if it has one entry
      // that is not a text node identical to the original node's value.
      if (newNodes.length > 0) {
        if (newNodes.length === 1 && newNodes[0].type === 'text' && newNodes[0].value === value) {
          // No effective change, the processed content is identical to the original.
        } else {
          // Replace the original text node with the new set of nodes.
          parent.children.splice(index, 1, ...newNodes);
          // Return [visit.SKIP, newIndex] to inform 'unist-util-visit'
          // to skip the newly inserted nodes and continue after them.
          return [visit.SKIP, index + newNodes.length];
        }
      }
    });
  };
}
