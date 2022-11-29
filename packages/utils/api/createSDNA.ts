import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CREATED_AT, SDNA_VERSION, SELF, ZOME } from "../constants/communityPredicates";
import { LATEST_SDNA_VERSION, SDNA_CREATION_DATE } from "../constants/sdna";
import { generateSDNALiteral } from "./generateSDNALiteral";
import { SDNAValues } from "./generateSDNALiteral";

export async function createSDNALink(perspectiveUuid: string, sdnaLiteral: Literal): Promise<LinkExpression> {
    const ad4mClient = await getAd4mClient();
    const sdnaUrl = sdnaLiteral.toUrl();
    const sdnaLink = await ad4mClient.perspective.addLink(
        perspectiveUuid,
        {
            source: SELF,
            predicate: ZOME,
            target: sdnaUrl
        }
    );
    await ad4mClient.perspective.addLink(
        perspectiveUuid,
        {
            source: sdnaUrl,
            predicate: SDNA_VERSION,
            target: `int://${LATEST_SDNA_VERSION}`
        }
    );
    await ad4mClient.perspective.addLink(
        perspectiveUuid,
        {
            source: sdnaUrl,
            predicate: CREATED_AT,
            target: SDNA_CREATION_DATE.toString()
        }
    )
    return sdnaLink;
}

export async function createSDNA(perspectiveUuid: string, values?: SDNAValues): Promise<LinkExpression> {
    const sdnaLiteral = await generateSDNALiteral(values);
    const sdnaLink = await createSDNALink(perspectiveUuid, sdnaLiteral);
    return sdnaLink;
}