import { useContext } from "preact/hooks";
import UIContext from "../../context/UIContext";
import CreatePost from "../CreatePost";

export default function Overlay({ perspective, agent, source }) {
  const { state: uiState, methods: UIMethods } = useContext(UIContext);

  const onPublished = (postId: string) => {
    UIMethods.goToPost(postId);
  };

  return (
    <j-modal
      size="fullscreen"
      open={uiState.showOverlay}
      onToggle={(e) => UIMethods.toggleOverlay(e.target.open)}
    >
      {uiState.showOverlay && (
        <CreatePost
          agent={agent}
          postId={uiState.currentPost}
          onCancel={() => UIMethods.toggleOverlay(false)}
          perspective={perspective}
          source={source}
          initialType={uiState.initialPostType}
          onPublished={onPublished}
        ></CreatePost>
      )}
    </j-modal>
  );
}
