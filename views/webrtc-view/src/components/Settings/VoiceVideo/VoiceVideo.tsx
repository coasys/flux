import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api/getMe";
import { useEffect, useState } from "preact/hooks";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function VoiceVideo({ webRTC }: Props) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function fetchAgent() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    }

    fetchAgent();
  }, []);

  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const audioDevices = devices.filter((d) => d.kind === "audioinput");

  return (
    <div>
      <h3>Voice & Video settings</h3>
      <j-box pt={300}>
        <j-text>Video input device:</j-text>
        <j-select>
          {videoDevices.map((v) => (
            <j-menu-item value={v.deviceId} key={v.deviceId}>
              {v.label}
            </j-menu-item>
          ))}
        </j-select>
      </j-box>

      <j-box pt={500}>
        <j-text>Audio input device:</j-text>
        <j-select>
          {audioDevices.map((v) => (
            <j-menu-item value={v.deviceId} key={v.deviceId}>
              {v.label}
            </j-menu-item>
          ))}
        </j-select>
      </j-box>
    </div>
  );
}
