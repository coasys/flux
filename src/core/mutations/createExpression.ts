import { ad4mClient } from "@/app";

export function createExpression(
  languageAddress: string,
  content: string
): Promise<string> {
  return ad4mClient.expression.create(content, languageAddress)
}
