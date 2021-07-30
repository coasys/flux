import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";
import { Link, LinkExpression } from "@perspect3vism/ad4m-types";

import { appActionContext } from "@/store/app/index";

export interface Payload {
  languageAddress: string;
  content: any;
  perspective: string;
}

export default async (
  context: any,
  { languageAddress, content, perspective }: Payload
): Promise<LinkExpression> => {
  const { commit: appCommit } = appActionContext(context);

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
    return addLink;
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
