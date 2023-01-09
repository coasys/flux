import { useContext } from "preact/hooks";
import UIContext from "../../context/UIContext";
import CreatePost from "../CreatePost";
import { ChannelContext } from "utils/react";

export default function Overlay() {
  const { state: channelState } = useContext(ChannelContext);
  const { state: uiState, methods: UIMethods } = useContext(UIContext);

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
          onPublished={() => UIMethods.toggleOverlay(false)}
        ></CreatePost>
      )}
    </j-modal>
  );
}
