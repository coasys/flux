import { createLink } from "@/core/mutations/createLink";
import {
  ChannelState,
  FeedType,
  MembraneType,
  JuntoExpressionReference,
} from "@/store/types";
import { v4 } from "uuid";
import { Perspective } from "@perspect3vism/ad4m";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { addPerspective } from "../mutations/addPerspective";
import { templateLanguage } from "../mutations/templateLanguage";
import { createNeighbourhood } from "../mutations/createNeighbourhood";
import { createNeighbourhoodMeta } from "./createNeighbourhoodMeta";
import { SOCIAL_CONTEXT_OFFICIAL } from "@/ad4m-globals";

interface ChannelProps {
  channelName: string;
  creatorDid: string;
  sourcePerspective: PerspectiveHandle;
  membraneType: MembraneType;
  typedExpressionLanguages: JuntoExpressionReference[];
}

export async function createChannel({
  channelName,
  creatorDid,
  sourcePerspective,
  membraneType,
  typedExpressionLanguages,
}: ChannelProps): Promise<ChannelState> {
  const perspective = await addPerspective(channelName);
  console.debug("Created new perspective with result", perspective);
  const socialContextLanguage = await templateLanguage(
    SOCIAL_CONTEXT_OFFICIAL,
    JSON.stringify({
      uid: v4().toString(),
      name: `${channelName}-social-context`,
    })
  );
  console.debug(
    "Created new social context language wuth result",
    socialContextLanguage
  );

  //Publish perspective
  const metaLinks = await createNeighbourhoodMeta(
    channelName,
    "",
    creatorDid,
    typedExpressionLanguages
  );

  const meta = new Perspective(metaLinks);

  const neighbourhood = await createNeighbourhood(
    perspective.uuid,
    socialContextLanguage.address,
    meta
  );
  console.log("Create a neighbourhood with result", neighbourhood);
  perspective.sharedUrl = neighbourhood;

  //Add link on channel social context declaring type
  const addChannelTypeLink = await createLink(perspective.uuid, {
    source: `${neighbourhood}://self`,
    target: "sioc://space",
    predicate: "rdf://type",
  });
  console.log(
    "Added link on channel social-context with result",
    addChannelTypeLink
  );

  return {
    neighbourhood: {
      name: channelName,
      description: "",
      creatorDid,
      perspective: perspective,
      typedExpressionLanguages: typedExpressionLanguages,
      neighbourhoodUrl: neighbourhood,
      membraneType: membraneType,
      linkedPerspectives: [],
      linkedNeighbourhoods: [],
      members: {},
      currentExpressionLinks: {},
      currentExpressionMessages: {},
      createdAt: new Date().toISOString(),
      membraneRoot: sourcePerspective.uuid,
    },
    state: {
      perspectiveUuid: perspective.uuid,
      hasNewMessages: false,
      feedType: FeedType.Signaled,
      notifications: {
        mute: false,
      },
    },
  } as ChannelState;
}
