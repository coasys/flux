import { version } from "../package.json";
import { getForVersion } from "@fluxapp/utils";
import { videoSettings } from "@fluxapp/constants";
import { IceServer } from "@fluxapp/webrtc";

export function getDefaultIceServers() {
  let defaultServers = videoSettings.defaultIceServers;

  try {
    const localServers = getForVersion(version, "iceServers");
    if (localServers) {
      const data = JSON.parse(localServers) as IceServer[];
      return data;
    }
  } catch (e) {
    return defaultServers;
  }

  return defaultServers;
}
