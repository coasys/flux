import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";
import { Link } from "@perspect3vism/ad4m-types";

import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";

export interface Payload {
  languageAddress: string;
  content: any;
  perspective: string;
}

export default async (
  context: any,
  { languageAddress, content, perspective }: Payload
): Promise<void> => {
  const { state: dataState, commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit, state: appState, getters: appGetters } = appActionContext(context);
  const { commit: userCommit, state: userState, getters: userGetters } = userActionContext(context);
  
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
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
