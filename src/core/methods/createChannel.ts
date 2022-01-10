import { createLink } from "@/core/mutations/createLink";
import {
  ChannelState,
  FeedType,
  MembraneType,
  FluxExpressionReference,
} from "@/store/types";
import { v4 } from "uuid";
import { Perspective, Link } from "@perspect3vism/ad4m";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { addPerspective } from "../mutations/addPerspective";
import { templateLanguage } from "../mutations/templateLanguage";
import { createNeighbourhood } from "../mutations/createNeighbourhood";
import { createNeighbourhoodMeta } from "./createNeighbourhoodMeta";
import { SOCIAL_CONTEXT_OFFICIAL } from "@/constants/languages";

interface ChannelProps {
  channelName: string;
  creatorDid: string;
  sourcePerspective: PerspectiveHandle;
  membraneType: MembraneType;
  typedExpressionLanguages: FluxExpressionReference[];
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
  console.debug("Create a neighbourhood with result", neighbourhood);

  const channelLink = new Link({
    source: sourcePerspective.sharedUrl!,
    target: neighbourhood,
    predicate: "sioc://has_space",
  });
  const addLinkToChannel = await createLink(
    sourcePerspective.uuid,
    channelLink
  );
  console.debug(
    "Created new link on source social-context with result",
    addLinkToChannel
  );

  //Add link on channel social context declaring type
  const addChannelTypeLink = await createLink(perspective.uuid, {
    source: neighbourhood,
    target: "sioc://space",
    predicate: "rdf://type",
  });
  console.log(
    "Added link on channel social-context with result",
    addChannelTypeLink
  );

  //Add link on channel social context declaring type
  const addSourceNeighbourhoodLink = await createLink(perspective.uuid, {
    source: neighbourhood,
    target: sourcePerspective.sharedUrl!,
    predicate: "flux://parentCommunity",
  });
  console.log(
    "Added link on channel pointing to parent neighbourhood",
    addSourceNeighbourhoodLink
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
      members: [],
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
