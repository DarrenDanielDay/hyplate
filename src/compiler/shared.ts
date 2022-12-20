export const str = (exp: unknown) => JSON.stringify(exp);

export const tabs = (indent: number) => " ".repeat(indent * 2);

export const createObjLikeExp = (props: Record<string, string>, indent: number, lineBreak: string) => {
  const propSpace = tabs(indent + 1);
  return `{${Object.entries(props)
    .map(
      ([key, value]) => `
${propSpace}${str(key)}: ${value}${lineBreak}`
    )
    .join("")}
${tabs(indent)}}`;
};

export const replaceExt = (path: string, suffix: string) => path.replace(/\.html$/, suffix);
