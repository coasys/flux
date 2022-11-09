import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { SELF, ZOME } from "../constants/communityPredicates";
import { generateSDNALiteral } from "./generateSDNALiteral";
import { SDNAValues } from "./generateSDNALiteral";

export async function createSDNALink(perspectiveUuid: string, sdnaLiteral: Literal): Promise<LinkExpression> {
    const ad4mClient = await getAd4mClient();
    const sdnaLink = await ad4mClient.perspective.addLink(
        perspectiveUuid,
        {
            source: SELF,
            predicate: ZOME,
            target: sdnaLiteral.toUrl(),
        }
    );
    return sdnaLink;
}

export async function createSDNA(perspectiveUuid: string, values?: SDNAValues): Promise<LinkExpression> {
    const sdnaLiteral = await generateSDNALiteral(values);
    const sdnaLink = await createSDNALink(perspectiveUuid, sdnaLiteral);
    return sdnaLink;
}