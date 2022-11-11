import { SDNAValues } from "./generateSDNALiteral";
import { createSDNA } from "./createSDNA";
import { LinkExpression } from "@perspect3vism/ad4m";
import { deleteSDNALinks } from "./deleteSDNALinks";
import { getSDNAVersion } from "./getSDNA";
import { LATEST_SDNA_VERSION } from "../constants/sdna";

export async function updateSDNA(perspectiveUuid: string, values?: SDNAValues): Promise<LinkExpression> {
    await deleteSDNALinks(perspectiveUuid);
    const sdnaLink = await createSDNA(perspectiveUuid, values);
    return sdnaLink;
}

export async function checkSDNAVersion(perspectiveUuid: string, values?: SDNAValues): Promise<boolean> {
    const sdnaVersion = await getSDNAVersion(perspectiveUuid);
    if (sdnaVersion === null) {
        return false;
    } else {
        if (sdnaVersion < LATEST_SDNA_VERSION) {
            createSDNA(perspectiveUuid, values);
            return true;
        }
        return false;
    }
}