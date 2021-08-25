import { createLink } from "@/core/mutations/createLink";
import {
  ChannelState,
  FeedType,
  MembraneType,
  JuntoExpressionReference,
} from "@/store/types";
import { v4 } from "uuid";
import path from "path";
import { Perspective, Link } from "@perspect3vism/ad4m";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { addPerspective } from "../mutations/addPerspective";
import { createUniqueHolochainLanguage } from "../mutations/createUniqueHolochainLanguage";
import { createNeighbourhood } from "../mutations/createNeighbourhood";
import { createNeighbourhoodMeta } from "./createNeighbourhoodMeta";

interface ChannelProps {
  channelName: string;
  languagePath: string;
  creatorDid: string;
  sourcePerspective: PerspectiveHandle;
  membraneType: MembraneType;
  typedExpressionLanguages: JuntoExpressionReference[];
}

export async function createChannel({
  channelName,
  languagePath,
  creatorDid,
  sourcePerspective,
  membraneType,
  typedExpressionLanguages,
}: ChannelProps): Promise<ChannelState> {
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
    source: `${sourcePerspective.sharedUrl}://self`,
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
