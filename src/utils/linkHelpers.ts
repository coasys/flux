import { LinkExpression, Literal } from "@perspect3vism/ad4m";

export function mapLiteralLinks(
  links: LinkExpression[] | undefined,
  map: any
): any {
  return Object.keys(map).reduce((acc, key) => {
    const predicate = map[key];
    const link = links?.find((link) => link.data.predicate === predicate);
    if (link) {
      return { ...acc, [key]: Literal.fromUrl(link.data.target).get() };
    }
    return acc;
  }, {});
}
