import { Message, Messages } from '@coasys/flux-types';
import { Ad4mClient, Expression, LinkExpression } from '@coasys/ad4m';

export async function getExpression(client: Ad4mClient, link: LinkExpression): Promise<Expression | null> {
  const expression = await client.expression.get(link.data.target);
  if (expression) {
    try {
      return { ...expression, data: JSON.parse(expression.data) };
    } catch (error) {
      console.error('expressionHelpers: Failed to parse expression data for', link.data.target, error);
      return null;
    }
  } else {
    return null;
  }
}

export async function getExpressions(
  client: Ad4mClient,
  expressionLinks: LinkExpression[],
): Promise<(Expression | null)[]> {
  const linkPromises = expressionLinks.map((link) => getExpression(client, link));
  return await Promise.all(linkPromises);
}

export function sortExpressionsByTimestamp(expressions: Messages, order: 'asc' | 'desc'): Message[] {
  return Object.values(expressions).sort((a, b) => {
    return order === 'asc'
      ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
