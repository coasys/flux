import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api";
import { getForVersion } from "utils/helpers";
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
    typeof webRTC.settings.video !== "boolean" &&
    webRTC.settings.video?.deviceId
      ? webRTC.settings.video?.deviceId
      : videoTrack?.getSettings().deviceId ||
        getForVersion("cameraDeviceId");

  const selectedAudioDeviceId =
    typeof webRTC.settings.audio !== "boolean" &&
    webRTC.settings.audio?.deviceId
      ? webRTC.settings.audio?.deviceId
      : audioTrack?.getSettings().deviceId ||
        getForVersion("audioDeviceId");

  const videoDevices = webRTC?.devices?.filter((d) => d.kind === "videoinput");
  const audioDevices = webRTC?.devices?.filter((d) => d.kind === "audioinput");

  return (
    <div>
      <h3>Voice & Video settings</h3>
      <j-box pt={300}>
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
