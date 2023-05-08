import { SDNAValues } from "./generateSDNALiteral";
import { getSDNACreationLinks } from "./createSDNA";
import { getSDNAVersion, getFluxSDNALinks } from "./getSDNA";
import { sdna } from "@fluxapp/constants";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const { LATEST_SDNA_VERSION } = sdna;

export async function updateSDNA(
  perspectiveUuid: string,
  values?: SDNAValues
): Promise<void> {
  const removals = await getFluxSDNALinks(perspectiveUuid);
  let additions;
  try {
    additions = await getSDNACreationLinks(perspectiveUuid, values);
  } catch (e) {
    additions = await getSDNACreationLinks(perspectiveUuid);
  }
  const ad4mClient = await getAd4mClient();
  await ad4mClient.perspective.linkMutations(perspectiveUuid, {
    removals,
    additions,
  });
}

export async function checkUpdateSDNAVersion(
  perspectiveUuid: string,
  lastSeenTimestamp: Date,
  values?: SDNAValues
): Promise<boolean> {
  const sdnaVersion = await getSDNAVersion(perspectiveUuid);
  console.warn("checkUpdateSDNAVersion: SDNA version", sdnaVersion);
  if (sdnaVersion === null) {
    return false;
  } else {
    if (
      sdnaVersion.version < LATEST_SDNA_VERSION &&
      sdnaVersion.timestamp < lastSeenTimestamp
    ) {
      console.warn(
        "checkUpdateSDNAVersion: SDNA version is outdated, updating SDNA"
      );
      console.warn("checkUpdateSDNAVersion: Found version data: ", sdnaVersion);
      await updateSDNA(perspectiveUuid, values);
      return true;
    }
    return false;
  }
}
