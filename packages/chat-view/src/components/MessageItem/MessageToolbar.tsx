import styles from "./index.scss";

export default function MessageToolbar({ onReplyClick, onOpenEmojiPicker }) {
  return (
    <div class={styles.messageToolbar}>
      <j-button onClick={onOpenEmojiPicker} variant="ghost" size="sm">
        <j-icon size="sm" name="emoji-smile"></j-icon>
      </j-button>

      <j-button onClick={onReplyClick} variant="ghost" size="sm">
        <j-icon size="sm" name="reply"></j-icon>
      </j-button>
    </div>
  );
}
