import { version } from "../package.json";
import { getForVersion } from "@coasys/flux-utils";
import { videoSettings } from "@coasys/flux-constants";
import { IceServer } from "@coasys/flux-webrtc";

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
