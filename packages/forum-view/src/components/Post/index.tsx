import UIContext from "../../context/UIContext";
import ChannelContext from "utils/react/ChannelContext";
import { useContext } from "preact/hooks";

export default function Post() {
  const { state: UIState, methods: UIMethods } = useContext(UIContext);
  const { state } = useContext(ChannelContext);
  const post = state.keyedPosts[UIState.currentPost];

  return (
    <div>
      <j-button variant="link" onClick={() => UIMethods.goToFeed()}>
        <j-icon name="arrow-left" slot="start"></j-icon>
        Back
      </j-button>
      <div>{post.title}</div>
    </div>
  );
}
