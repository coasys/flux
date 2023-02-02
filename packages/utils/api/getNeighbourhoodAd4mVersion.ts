import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { AD4M_VERSION } from "../constants/communityPredicates";

export default async function getNeighbourhoodAd4mVersion(neighbourhoodUrl: string): Promise<String | undefined> {
    const client = await getAd4mClient();
    const neighbourhood = await client.expression.get(neighbourhoodUrl);
    const links = JSON.parse(neighbourhood.data).meta.links;
    const versionLink = links.find((link: any) => link.data.predicate === AD4M_VERSION);

    if (versionLink) {
        return versionLink.data.target;
    } else {
        return undefined;
    }
}