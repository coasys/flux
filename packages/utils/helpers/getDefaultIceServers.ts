import { version } from "../package.json";
import { getForVersion } from "utils/helpers/localStorage";
import { defaultIceServers } from "utils/constants/videoSettings";
import { IceServer } from "utils/helpers/WebRTCManager";

export function getDefaultIceServers() {
  let defaultServers = defaultIceServers;

  try {
    const localServers = getForVersion("iceServers");
    if (localServers) {
      const data = JSON.parse(localServers) as IceServer[];
      return data;
    }
  } catch (e) {
    return defaultServers;
  }

  return defaultServers;
}
