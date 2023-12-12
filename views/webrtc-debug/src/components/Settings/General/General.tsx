import { Me } from "@coasys/flux-api";
import { WebRTC } from "@coasys/flux-react-web";

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
