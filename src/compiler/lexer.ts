import { NodeType, type PlainTextNode, type ViewModelPropertyNode } from "./ast.js";
import type { Locator } from "./locator.js";

export const isValidIdentifier = (name: string): boolean => {
  try {
    eval(`\
(function (){
  "use strict";
  var ${name}
})()`);
    return true;
  } catch (error) {
    return false;
  }
};

const SPACE_REGEX = /\s/;

export const isSpace = (char: string) => SPACE_REGEX.test(char);

export const leadingSpaceCount = (text: string) => {
  for (let i = 0, l = text.length; i < l; i++) {
    const char = text[i];
    if (!isSpace(char)) {
      return i;
    }
  }
  return text.length;
};

export const trailingSpaceCount = (text: string) => {
  for (let i = 0, l = text.length; i < l; i++) {
    const char = text[l - 1 - i];
    if (!isSpace(char)) {
      return i;
    }
  }
  return text.length;
}

const VM_PROP_PATTERN = "([^:{}]+)(:([^:{}]+))?";
const BRACED_VM_PROP_PATTERN = `{{${VM_PROP_PATTERN}}}|{${VM_PROP_PATTERN}}`;

export const parseVMPropsInText = (
  text: string,
  locator: Locator,
  offset: number
): (ViewModelPropertyNode | PlainTextNode)[] => {
  const regExp = new RegExp(BRACED_VM_PROP_PATTERN, "g");
  const result: (ViewModelPropertyNode | PlainTextNode)[] = [];
  let begin = 0;
  const plainText = (startIndex: number, content: string): PlainTextNode => {
    const begin = offset + startIndex;
    const end = begin + content.length;
    return {
      type: NodeType.PlainText,
      content,
      loc: locator.range(begin, end),
    };
  };
  for (let match = regExp.exec(text); match; match = regExp.exec(text)) {
    const [matched, i1, , i2, b1, , b2] = match;
    const matchStart = match.index;
    const end = matchStart + matched.length;
    let skip = false;
    let node: ViewModelPropertyNode | PlainTextNode | null = null;
    const [type, first, second, braceCount] = i1
      ? ([NodeType.Interpolation, i1, i2, 2] as const)
      : ([NodeType.Binding, b1!, b2, 1] as const);
    if (!isValidIdentifier(first)) {
      skip = true;
    } else {
      if (second) {
        if (!isValidIdentifier(second)) {
          skip = true;
        } else {
          const space1 = leadingSpaceCount(first);
          const space2 = leadingSpaceCount(second);
          const identifier = first.trim();
          const typedef = second.trim();
          node = {
            type,
            identifier: plainText(matchStart + braceCount + space1, identifier),
            typedef: plainText(matchStart + braceCount + first.length + 1 + space2, typedef),
            loc: locator.range(offset + matchStart, offset + end),
          };
        }
      } else {
        const space = leadingSpaceCount(first);
        node = {
          type,
          typedef: void 0,
          identifier: plainText(matchStart + braceCount + space, first.trim()),
          loc: locator.range(offset + matchStart, offset + end),
        };
      }
    }
    if (skip) {
      const content = text.slice(begin, end);
      result.push(plainText(begin, content));
    } else if (begin !== matchStart) {
      const content = text.slice(begin, matchStart);
      result.push(plainText(begin, content));
    }
    if (node) {
      result.push(node);
    }
    begin = end;
  }
  if (begin !== text.length) {
    const restContent = text.slice(begin);
    result.push(plainText(begin, restContent));
  }
  return result;
};
