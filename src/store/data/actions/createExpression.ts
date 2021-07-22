import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";
import { Link } from "@perspect3vism/ad4m-types";

import { rootActionContext } from "@/store/index";

export interface Payload {
  languageAddress: string;
  content: any;
  perspective: string;
}

export default async (
  context: any,
  { languageAddress, content, perspective }: Payload
): Promise<void> => {
  const { commit } = rootActionContext(context);
  try {
    console.log(
      new Date().toISOString(),
      "Posting shortForm expression to language",
      languageAddress
    );

    const exprUrl = await createExpression(
      languageAddress,
      JSON.stringify(content)
    );
    console.log("Created expression with hash", exprUrl);
    const addLink = await createLink(perspective, {
      source: "sioc://chatchannel",
      target: exprUrl,
      predicate: "sioc://content_of",
    } as Link);
    console.log("Adding link with response", addLink);

    // TODO: Add optimistic UI pattern so it feels fast
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
