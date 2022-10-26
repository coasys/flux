import styles from "./index.scss";
import Avatar from "../../components/Avatar";

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
      <j-box mb="400">
        <j-flex gap="400" a="center">
          <j-flex
            a="center"
            gap="300"
            onClick={() => onProfileClick(replyAuthor?.did)}
          >
            <Avatar
              did={replyAuthor.did}
              url={replyAuthor.thumbnailPicture}
              size="xs"
            ></Avatar>
            {replyAuthor.username ? (
              <j-text nomargin color="black" size="400" weight="600">
                {replyAuthor?.username}
              </j-text>
            ) : (
              <j-skeleton width="full" height="sm" />
            )}
          </j-flex>
          <div
            class={styles.replyContent}
            dangerouslySetInnerHTML={{ __html: replyMessage.content }}
          />
        </j-flex>
      </j-box>
    </>
  );
}
