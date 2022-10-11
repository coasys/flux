import { LinkExpression } from "@perspect3vism/ad4m";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  linkExpression: LinkExpression;
}

export default async function ({ perspectiveUuid, linkExpression }: Payload) {
  try {
    await ad4mClient.perspective.removeLink(perspectiveUuid, linkExpression);
  } catch (e: any) {
    throw new Error(e);
  }
}
