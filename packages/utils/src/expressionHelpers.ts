import { Message, Messages } from "@coasys/flux-types";
import { Expression, LinkExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

export async function getExpression(
  link: LinkExpression
): Promise<Expression | null> {
  const client = await getAd4mClient();

  const expression = await client.expression.get(link.data.target);
  if (expression) {
    return { ...expression, data: JSON.parse(expression.data) };
  } else {
    return null;
  }
}

export async function getExpressions(expressionLinks: LinkExpression[]) {
  const linkPromises = expressionLinks.map((link) => getExpression(link));
  return await Promise.all(linkPromises);
}

export function sortExpressionsByTimestamp(
  expressions: Messages,
  order: "asc" | "desc"
): Message[] {
  return Object.values(expressions).sort((a, b) => {
    return order === "asc"
      ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
