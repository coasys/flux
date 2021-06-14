import { LinkExpression, Signal } from "@perspect3vism/ad4m-executor";

export default function (
  signal: Signal
): { link: LinkExpression; language: string } | undefined {
  const parsedSignal = JSON.parse(signal.signal!);
  const language = signal.language!;
  const linkExpression = parsedSignal.data.payload as LinkExpression;

  if (
    linkExpression.data &&
    linkExpression.data!.predicate &&
    linkExpression.data!.source &&
    linkExpression.data!.target
  ) {
    return { link: linkExpression, language };
  }
}
