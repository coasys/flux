import { useContext } from "preact/hooks";
import UIContext from "../../context/UIContext";
import CreatePost from "../CreatePost";
import { ChannelContext } from "utils/react-web";

export default function Overlay({ perspective, source }) {
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
