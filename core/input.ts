import Quill from '../core/quill';
import type { Range } from '../core/selection';
import { deleteRange } from '../modules/keyboard';

class Input {
  constructor(private quill: Quill) {
    quill.root.addEventListener('beforeinput', event => {
      if (!event.defaultPrevented && !event.isComposing) {
        this.handleInput(event);
      }
    });

    quill.root.addEventListener('compositionstart', () => {
      const range = quill.getSelection();
      if (range && range.length) {
        console.log('=batch', this.quill.scroll.batch);
        this.replaceSelection(range);
      }
    });
  }

  private getRangeFromStaticRange(staticRange: StaticRange) {
    const normalized = this.quill.selection.normalizeNative(staticRange);
    return normalized
      ? this.quill.selection.normalizedToRange(normalized)
      : null;
  }

  private replaceSelection(range: Range, text = '') {
    deleteRange({ range, quill: this.quill });
    if (text) {
      this.quill.insertText(range.index, text, Quill.sources.USER);
    }
    this.quill.setSelection(range.index + text.length, 0, Quill.sources.SILENT);
  }

  private handleInput(event: InputEvent) {
    const staticRange = event.getTargetRanges
      ? event.getTargetRanges()[0]
      : null;
    if (!staticRange || staticRange.collapsed === true) {
      return;
    }

    switch (event.inputType) {
      case 'insertText':
      case 'insertReplacementText': {
        const text = getPlainTextFromInputEvent(event);
        if (typeof text === 'string') {
          const range = this.getRangeFromStaticRange(staticRange);
          if (range && range.length > 0) {
            this.replaceSelection(range, text);
            event.preventDefault();
          }
        }
        break;
      }
      default:
        break;
    }
  }
}

// Obtain plain text content from either `data` or `dataTransfer`.
// We don't determine the `inputType` to decide which property to get the content from,
// as different browsers behave differently: Although the spec states that when the `inputType` is `insertText`,
// the text content should be provided through `data`, some browsers (e.g., Safari 14~16) put the content in `dataTransfer`.
function getPlainTextFromInputEvent(event: InputEvent) {
  if (typeof event.data === 'string') {
    return event.data;
  }
  if (event.dataTransfer?.types.includes('text/plain')) {
    return event.dataTransfer.getData('text/plain');
  }
  return null;
}

export default Input;
