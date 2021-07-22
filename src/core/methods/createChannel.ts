import { createLink } from "@/core/mutations/createLink";
import {
  ChannelState,
  FeedType,
  MembraneType,
  JuntoExpressionReference,
} from "@/store";
import { v4 } from "uuid";
import path from "path";
import { Perspective, Link } from "@perspect3vism/ad4m-types";
import type { PerspectiveHandle } from "@perspect3vism/ad4m-types";
import { addPerspective } from "../mutations/addPerspective";
import { createUniqueHolochainLanguage } from "../mutations/createUniqueHolochainLanguage";
import { createNeighbourhood } from "../mutations/createNeighbourhood";

export async function createChannel(
  channelName: string,
  languagePath: string,
  sourcePerspective: PerspectiveHandle,
  membraneType: MembraneType,
  typedExpressionLanguages: JuntoExpressionReference[]
): Promise<ChannelState> {
  console.debug("Create channel called");
  const perspective = await addPerspective(channelName);
  console.debug("Created new perspective with result", perspective);
  const socialContextLanguage = await createUniqueHolochainLanguage(
    path.join(languagePath, "social-context-channel"),
    "social-context",
    v4().toString()
  );
  console.debug(
    "Created new social context language wuth result",
    socialContextLanguage
  );
  const meta = new Perspective();
  const neighbourhood = await createNeighbourhood(
    perspective.uuid,
    socialContextLanguage.address,
    meta
  );
  console.debug("Create a neighbourhood with result", neighbourhood);

  const channelLink = new Link({
    source: `${sourcePerspective.sharedUrl}://self`,
    target: neighbourhood,
    predicate: "sioc://has_space",
  });
  const addLinkToChannel = await createLink(perspective.uuid, channelLink);
  console.debug("Created new link on channel with result", addLinkToChannel);

  //Add link on channel social context declaring type
  const addChannelTypeLink = await createLink(perspective.uuid, {
    source: `${neighbourhood}://self`,
    target: "sioc://space",
    predicate: "rdf://type",
  });
  console.log(
    "Added link on channel social context with result",
    addChannelTypeLink
  );

  const now = new Date();

  return {
    name: channelName,
    hasNewMessages: false,
    perspective: perspective,
    type: FeedType.Signaled,
    createdAt: now,
    linkLanguageAddress: socialContextLanguage.address,
    currentExpressionLinks: {},
    currentExpressionMessages: {},
    neighbourhoodUrl: neighbourhood,
    membraneType: membraneType,
    groupExpressionRef: "",
    typedExpressionLanguages: typedExpressionLanguages,
    notifications: {
      mute: false,
    },
  } as ChannelState;
}
