import { Me } from "@fluxapp/api";
import { version } from "../../../../package.json";
import { getForVersion } from "@fluxapp/utils";
import { WebRTC } from "@fluxapp/react-web";

import Select from "../../Select";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function VoiceVideo({ webRTC }: Props) {
  const videoTrack = webRTC.localStream
    ?.getTracks()
    ?.find((track) => track.kind === "video");

  const audioTrack = webRTC.localStream
    ?.getTracks()
    ?.find((track) => track.kind === "audio");

  const selectedVideoDeviceId =
    typeof webRTC.localState.settings.video !== "boolean" &&
    webRTC.localState.settings.video?.deviceId
      ? webRTC.localState.settings.video?.deviceId
      : videoTrack?.getSettings().deviceId ||
        getForVersion(version, "cameraDeviceId");

  const selectedAudioDeviceId =
    typeof webRTC.localState.settings.audio !== "boolean" &&
    webRTC.localState.settings.audio?.deviceId
      ? webRTC.localState.settings.audio?.deviceId
      : audioTrack?.getSettings().deviceId ||
        getForVersion(version, "audioDeviceId");

  const videoDevices = webRTC?.devices
    ?.filter((d) => d.kind === "videoinput")
    .filter((d) => !!d.deviceId);
  const audioDevices = webRTC?.devices
    ?.filter((d) => d.kind === "audioinput")
    .filter((d) => !!d.deviceId);

  return (
    <div>
      <h3>Voice & Video settings</h3>
      <j-box pt={300}>
        <j-flex j="end" a="center" gap="200" direction="row">
          <Select
            name="video-device"
            label="Video input device"
            placeholder="Select device"
            selected={selectedVideoDeviceId}
            options={videoDevices.map((v) => ({
              text: v.label,
              value: v.deviceId,
            }))}
            onChange={(e) => {
              webRTC.onChangeCamera(e.target.value);
            }}
          />

          {!webRTC.videoPermissionGranted && (
            <j-box pt={600}>
              <j-button onClick={() => webRTC.onToggleCamera(true)} size="sm">
                Allow permission
              </j-button>
            </j-box>
          )}
        </j-flex>
      </j-box>

      <j-box pt={500}>
        <Select
          name="audio-device"
          label="Audio input device"
          placeholder="Select device"
          selected={selectedAudioDeviceId}
          options={audioDevices.map((v) => ({
            text: v.label,
            value: v.deviceId,
          }))}
          onChange={(e) => {
            webRTC.onChangeAudio(e.target.value);
          }}
        />
      </j-box>
    </div>
  );
}
