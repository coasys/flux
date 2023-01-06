import { getImage } from "utils/helpers/getImage";
import { useContext, useEffect, useState } from "preact/hooks";
import UIContext from "../../context/UIContext";
import CreatePost from "../CreatePost";
import { ChannelContext } from "utils/react";

export default function Overlay() {
  const { state: channelState } = useContext(ChannelContext);
  const { state: uiState, methods: UIMethods } = useContext(UIContext);
  // const [img, setImage] = useState(null);

  // async function fetchImage(imageUrl) {
  //   try {
  //     setLoading(true);
  //     const image = await getImage(imageUrl);
  //     setImage(image);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // useEffect(() => {
  //   if (url) {
  //     fetchImage(url);
  //   }
  // }, [did, url]);

  return (
    <j-modal
      size="fullscreen"
      open={uiState.showOverlay}
      onToggle={(e) => UIMethods.toggleOverlay(e.target.open)}
    >
      {uiState.showOverlay && (
        <CreatePost
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
