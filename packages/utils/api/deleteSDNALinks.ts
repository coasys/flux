import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { getSDNALinks } from "./getSDNA";

export async function deleteSDNALinks(perspectiveUuid: string) {
    console.log("Deleting SDNALinks");
    const ad4mClient = await getAd4mClient();
    const existingSDNALinks = await getSDNALinks(perspectiveUuid);
    console.log("Got existing links", existingSDNALinks);
    for (const link of existingSDNALinks) {
        if (link.data.target.includes("flux_message")) {
            await ad4mClient.perspective.removeLink(perspectiveUuid, link);
        }
    }
}