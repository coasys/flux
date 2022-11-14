import { SDNAValues } from "./generateSDNALiteral";
import { createSDNA } from "./createSDNA";
import { LinkExpression } from "@perspect3vism/ad4m";
import { deleteSDNALinks } from "./deleteSDNALinks";
import { getSDNAVersion } from "./getSDNA";
import { LATEST_SDNA_VERSION } from "../constants/sdna";

export async function updateSDNA(perspectiveUuid: string, values?: SDNAValues): Promise<LinkExpression> {
    let sdnaLink;
    await deleteSDNALinks(perspectiveUuid);
    try {
        sdnaLink = await createSDNA(perspectiveUuid, values);
    } catch (e) {
        sdnaLink = await createSDNA(perspectiveUuid);
    } finally {
        return sdnaLink;
    }
}

export async function checkUpdateSDNAVersion(perspectiveUuid: string, lastSeenTimestamp: Date, values?: SDNAValues): Promise<boolean> {
    const sdnaVersion = await getSDNAVersion(perspectiveUuid);
    console.warn("checkUpdateSDNAVersion: SDNA version", sdnaVersion);
    if (sdnaVersion === null) {
        return false;
    } else {
        if (sdnaVersion.version < LATEST_SDNA_VERSION && sdnaVersion.timestamp < lastSeenTimestamp) {
            console.warn("checkUpdateSDNAVersion: SDNA version is outdated, updating SDNA");
            console.warn("checkUpdateSDNAVersion: Found version data: ", sdnaVersion);
            await updateSDNA(perspectiveUuid, values);
            return true;
        }
        return false;
    }
}