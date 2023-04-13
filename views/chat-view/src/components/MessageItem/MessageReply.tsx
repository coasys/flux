import styles from "./index.module.css";
import Avatar from "../../components/Avatar";

export default function MessageReply({
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
        <a class={styles.replyAuthor} href={replyAuthor?.did}>
          <Avatar
            did={replyAuthor.did}
            url={replyAuthor.profileThumbnailPicture}
            size="xxs"
          ></Avatar>
          <div class={styles.replyUsername}>
            {replyAuthor.username || <j-skeleton width="xl" height="text" />}
          </div>
        </a>
        <div
          onClick={onMessageClick}
          class={styles.replyContent}
          dangerouslySetInnerHTML={{ __html: replyMessage.content.trim() }}
        />
      </div>
    </div>
  );
}
