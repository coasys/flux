import styles from "./index.scss";
import Avatar from "../../components/Avatar";

export default function MessageReply({
  onProfileClick,
  replyAuthor,
  replyMessage,
  onMessageClick,
}) {
  return (
    <div style={{ display: "contents" }}>
      <div class={styles.replyLineWrapper}>
        <div class={styles.replyLine} />
      </div>
      <div class={styles.replyMessage}>
        <div
          class={styles.replyAuthor}
          onClick={() => onProfileClick(replyAuthor?.did)}
        >
          <Avatar
            did={replyAuthor.did}
            url={replyAuthor.profileThumbnailPicture}
            size="xxs"
          ></Avatar>
          <div class={styles.replyUsername}>
            {replyAuthor.username || <j-skeleton width="xl" height="text" />}
          </div>
        </div>
        <div
          onClick={onMessageClick}
          class={styles.replyContent}
          dangerouslySetInnerHTML={{ __html: replyMessage.content.trim() }}
        />
      </div>
    </div>
  );
}
