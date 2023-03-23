import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function General({}: Props) {
  return (
    <div>
      <p>General settings</p>
    </div>
  );
}
