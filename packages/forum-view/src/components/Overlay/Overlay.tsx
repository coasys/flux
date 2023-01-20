import { useContext } from "preact/hooks";
import UIContext from "../../context/UIContext";
import CreatePost from "../CreatePost";
import { ChannelContext } from "utils/react";

export default function Overlay() {
  const { state: channelState } = useContext(ChannelContext);
  const { state: uiState, methods: UIMethods } = useContext(UIContext);

  const onPublished = (postId: string) => {
    UIMethods.goToPost(postId);

    // TEMP: Reload to fetch updated post
    if (postId === uiState.currentPost) {
      location.reload();
    }
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
          communityId={channelState.communityId}
          channelId={channelState.channelId}
          initialType={uiState.initialPostType}
          onPublished={onPublished}
        ></CreatePost>
      )}
    </j-modal>
  );
}
