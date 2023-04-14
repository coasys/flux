import { Me } from "utils/api";
import { WebRTC } from "utils/frameworks/react";

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
