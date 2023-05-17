import CommentItem from "../CommentItem";
import { useState } from "preact/hooks";
import { Message as MessageModel } from "@fluxapp/api";
import { useEntries } from "@fluxapp/react-web";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

export default function CommentSection({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  const { entries: comments } = useEntries({
    perspective,
    source: source || null,
    model: MessageModel,
  });

  return (
    <>
      <j-box pt="900">
        <flux-editor
          placeholder="Add a comment..."
          source={source}
          perspective={perspective}
          agent={agent}
        ></flux-editor>
      </j-box>
      <j-box pt="900">
        <j-text variant="label">Comments ({comments.length})</j-text>
        <j-box>
          {comments.map((comment) => {
            return (
              <j-box key={comment.id} mt="400">
                <CommentItem
                  agent={agent}
                  perspective={perspective}
                  comment={comment}
                ></CommentItem>
              </j-box>
            );
          })}
        </j-box>
      </j-box>
    </>
  );
}
