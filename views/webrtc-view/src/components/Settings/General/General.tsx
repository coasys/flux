import { Me } from "@fluxapp/api";
import { WebRTC } from "@fluxapp/react-web";

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
