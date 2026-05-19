import CommentItem from '../CommentItem';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Message } from '@coasys/flux-api';
import { useMe } from '@coasys/flux-react-web';
import { Link, PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import styles from './CommentSection.module.css';
import Avatar from '../Avatar';

export default function CommentSection({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  const myAgent = useMe(agent);

  const editor = useRef(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [comments, setComments] = useState<Message[]>([]);

  async function loadComments() {
    // Use findAll with parent scope instead of N × new Message().get() to avoid N+1 queries
    const messages = await Message.findAll(perspective, { parent: { id: source, predicate: 'ad4m://has_child' } });
    setComments(messages.filter((m: any) => m.body));
  }

  useEffect(() => {
    loadComments();
    // Use a targeted SPARQL subscription for child messages instead of
    // firing on every link-added event in the entire perspective.
    const sparql = `SELECT ?target WHERE { <${source}> <ad4m://has_child> ?target . ?target <flux://entry_type> <flux://has_message> . }`;
    let sub: any = null;
    perspective.subscribeQuery(sparql).then((handle) => {
      sub = handle;
      handle.onResult(() => { loadComments(); });
    });
    return () => { sub?.dispose(); };
  }, [source]);

  function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  async function submit() {
    try {
      const html = editor.current?.editor.getHTML();
      editor.current?.clear();
      const message = await Message.create(perspective, { body: html });
      await perspective.add(new Link({ source, predicate: 'ad4m://has_child', target: message.id }));
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.base} part="base">
      <j-flex a="center" gap="400">
        <div>
          <Avatar size="sm" did={myAgent.me?.did} url={myAgent.profile?.profileThumbnailPicture}></Avatar>
        </div>
        <flux-editor
          part="editor"
          ref={editor}
          onKeydown={onKeydown}
          aria-expanded={showToolbar}
          className={styles.editor}
          perspective={perspective}
          agent={agent}
          source={source}
        >
          <footer className={styles.footer} slot="footer">
            <j-button
              className="toggle-formatting"
              onClick={() => setShowToolbar(!showToolbar)}
              circle
              square
              size="sm"
              variant="ghost"
            >
              <j-icon size="sm" name="type"></j-icon>
            </j-button>
            <j-button onClick={submit} className={styles.submitButton} size="sm" variant="primary">
              Publish
            </j-button>
          </footer>
        </flux-editor>
      </j-flex>
      {comments.length > 0 && (
        <div className={styles.comments} part="comments">
          {comments.map((comment) => (
            <CommentItem agent={agent} perspective={perspective} comment={comment}></CommentItem>
          ))}
        </div>
      )}
    </div>
  );
}
