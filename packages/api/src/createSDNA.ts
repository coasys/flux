import { Link, LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import {
  CREATED_AT,
  SDNA_VERSION,
  SELF,
  ZOME,
} from "./constants/communityPredicates";
import { LATEST_SDNA_VERSION, SDNA_CREATION_DATE } from "./constants/sdna";
import { generateSDNALiteral } from "./generateSDNALiteral";
import { SDNAValues } from "./generateSDNALiteral";

export function generateSDNALinks(sdnaLiteral: Literal): Link[] {
  const sdnaUrl = sdnaLiteral.toUrl();
  const links = [
    new Link({
      source: SELF,
      predicate: ZOME,
      target: sdnaUrl,
    }),
    new Link({
      source: sdnaUrl,
      predicate: SDNA_VERSION,
      target: `int://${LATEST_SDNA_VERSION}`,
    }),
    new Link({
      source: sdnaUrl,
      predicate: CREATED_AT,
      target: SDNA_CREATION_DATE.toString(),
    }),
  ];
  return links;
}

export async function createSDNALink(
  perspectiveUuid: string,
  sdnaLiteral: Literal
): Promise<LinkExpression> {
  const ad4mClient = await getAd4mClient();
  const links = generateSDNALinks(sdnaLiteral);
  const createdLinks = await ad4mClient.perspective.addLinks(
    perspectiveUuid,
    links
  );
  const sdnaLink = createdLinks[0];
  return sdnaLink;
}

export async function createSDNA(
  perspectiveUuid: string,
  values?: SDNAValues
): Promise<LinkExpression> {
  const sdnaLiteral = await generateSDNALiteral(values);
  const sdnaLink = await createSDNALink(perspectiveUuid, sdnaLiteral);
  return sdnaLink;
}

export async function getSDNACreationLinks(
  perspectiveUuid: string,
  values?: SDNAValues
): Promise<Link[]> {
  const sdnaLiteral = await generateSDNALiteral(values);
  const links = generateSDNALinks(sdnaLiteral);
  return links;
}
