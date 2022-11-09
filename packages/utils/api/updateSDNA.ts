import { SDNAValues } from "./generateSDNALiteral";
import { createSDNA } from "./createSDNA";
import { LinkExpression } from "@perspect3vism/ad4m";
import { deleteSDNALinks } from "./deleteSDNALinks";

export async function updateSDNA(perspectiveUuid: string, values?: SDNAValues): Promise<LinkExpression> {
    await deleteSDNALinks(perspectiveUuid);
    const sdnaLink = await createSDNA(perspectiveUuid, values);
    return sdnaLink;
}