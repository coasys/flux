import styles from "./index.module.css";
import Avatar from "../../components/Avatar";

export default function MessageReply({
  did,
  replyAuthor,
  replyMessage,
  onMessageClick,
}) {
  function onMsClick(e) {
    e.preventDefault();
    e.stopPropagation();
    onMessageClick(e);
  }

  return (
    <div style={{ display: "contents" }}>
      <div className={styles.replyLineWrapper}>
        <div className={styles.replyLine} />
      </div>
      <div className={styles.replyMessage}>
        <a className={styles.replyAuthor} href={did}>
          <Avatar
            did={did}
            url={replyAuthor?.profileThumbnailPicture}
            size="xxs"
          ></Avatar>
          <div className={styles.replyUsername}>
            {replyAuthor?.username || <j-skeleton width="xl" height="text" />}
          </div>
        </a>
        <div
          onClick={onMsClick}
          className={styles.replyContent}
          dangerouslySetInnerHTML={{ __html: replyMessage.content.trim() }}
        />
      </div>
    </div>
  );
}
