import { visit } from 'unist-util-visit';
import { isWhitespaceCharacter } from 'is-whitespace-character';

const DOUBLE_PLUS = '++';

export default function remarkKbdPlus(_options = {}) {
  return function transformer(tree, _file) {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') {
        return;
      }

      const value = node.value;
      if (!value.includes(DOUBLE_PLUS)) {
        return;
      }

      const newNodes = [];
      let lastIndex = 0;
      let matchStart = -1; // -1 means we are not currently inside a potential kbd sequence

      for (let i = 0; i < value.length; i++) {
        if (matchStart === -1) { // Looking for an opening ++
          if (value.startsWith(DOUBLE_PLUS, i)) {
            // Potential opening ++
            // Avoid ++++
            if (value.startsWith(DOUBLE_PLUS + DOUBLE_PLUS, i)) {
              i += 3; // Skip entire ++++ sequence
              continue;
            }
            // Avoid ++ followed by whitespace
            if (isWhitespaceCharacter(value.charAt(i + 2))) {
              i += 1; // Skip this ++, effectively consuming only the first +
              continue;
            }
            // Valid opening ++
            if (i > lastIndex) { // Capture text before this new kbd sequence
              newNodes.push({ type: 'text', value: value.substring(lastIndex, i) });
            }
            matchStart = i;
            i += 1; // Advance past the first '+', loop increment will handle the second '+'
            // lastIndex will be updated when the kbd is closed or at the end.
          }
          // If not starting with ++, character will be handled by trailing text logic
        } else { // Inside a kbd sequence (matchStart is not -1), looking for closing ++
          if (value.startsWith(DOUBLE_PLUS, i)) {
            // Found closing ++
            const kbdContent = value.substring(matchStart + 2, i);

            newNodes.push({
              type: 'kbd',
              children: [{ type: 'text', value: kbdContent }],
              data: { hName: 'kbd' },
            });

            lastIndex = i + 2;
            matchStart = -1; // Reset: no longer in a kbd sequence
            i += 1; // Advance past the first '+', loop increment will handle the second '+'
          }
          // If not a closing ++, this character is part of kbdContent. Loop continues.
        }
      }

      // After the loop, handle any remaining state

      if (matchStart !== -1) {
        // Unterminated kbd sequence, treat as literal text from original matchStart
        // This means we need to push the text from lastIndex up to matchStart (if any, handled by opener)
        // and then from matchStart to the end of the string.
        // However, newNodes might already contain text pushed before matchStart.
        // Simplest: if matchStart is active, all previous newNodes are valid.
        // The text from matchStart to end is literal.
        if (value.length > matchStart) { // Check if there's any text starting from matchStart
          // If newNodes' last element was the text before this unterminated kbd,
          // and lastIndex was updated to matchStart by that push.
          // This case means an opening ++ was found but no closing ++.
          // The text from lastIndex to value.length should be added.
          // lastIndex should point to where the text before the opening ++ ended.
          // The text from matchStart to the end should be added.
          // This situation is tricky. If newNodes has items, and lastIndex was the start of matchStart...
          // Let's assume the current lastIndex is where the last successfully processed segment ended.
          newNodes.push({ type: 'text', value: value.substring(lastIndex) });
          lastIndex = value.length; // Consumed everything
        }
      } else {
        // Loop finished, matchStart is -1 (or was never set)
        // Add any remaining text after the last processed kbd or if no kbd was found at all
        if (lastIndex < value.length) {
          newNodes.push({ type: 'text', value: value.substring(lastIndex) });
        }
      }


      if (newNodes.length > 0) {
        // Only replace if there were actual changes or segmentations.
        // If newNodes is just one text node spanning the original value, no splice needed.
        if (newNodes.length === 1 && newNodes[0].type === 'text' && newNodes[0].value === value) {
          // No actual change
        } else {
          parent.children.splice(index, 1, ...newNodes);
          return [visit.SKIP, index + newNodes.length];
        }
      }
    });
  };
}
