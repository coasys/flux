import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";
import { useAppStore } from "@/store/app";
import { Link, LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  languageAddress: string;
  content: any;
  perspective: string;
}

export default async ({
  languageAddress,
  content,
  perspective,
}: Payload): Promise<LinkExpression> => {
  const appStore = useAppStore();

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
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
