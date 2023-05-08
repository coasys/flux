import { useContext } from "preact/hooks";
import UiContext from "../../context/UiContext";
import Settings from "../Settings";
import { Me } from "utils/api";
import { WebRTC } from "utils/react-web";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function Overlay({ webRTC, currentUser }: Props) {
  const { state: uiState, methods: UIMethods } = useContext(UiContext);

  // const onPublished = (postId: string) => {
  //   UIMethods.goToPost(postId);

  //   // TEMP: Reload to fetch updated post
  //   if (postId === uiState.currentPost) {
  //     location.reload();
  //   }
  // };

  return (
    <j-modal
      size="l"
      open={uiState.showSettings}
      onToggle={(e) => UIMethods.toggleShowSettings(e.target.open)}
    >
      {uiState.showSettings && (
        <Settings webRTC={webRTC} currentUser={currentUser} />
      )}
    </j-modal>
  );
}
