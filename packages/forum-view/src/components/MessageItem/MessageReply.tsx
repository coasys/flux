import styles from "./index.scss";
import Avatar from "../Avatar";

export default function MessageReply({
  onProfileClick,
  replyAuthor,
  replyMessage,
}) {
  return (
    <>
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
            url={replyAuthor.thumbnailPicture}
            size="xxs"
          ></Avatar>
          <div class={styles.replyUsername}>
            {replyAuthor.username || <j-skeleton width="xl" height="text" />}
          </div>
        </div>
        <div
          class={styles.replyContent}
          dangerouslySetInnerHTML={{ __html: replyMessage.content }}
        />
      </div>
    </>
  );
}
