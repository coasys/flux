import React, { createContext, useState, useEffect, useRef } from "react";
import { Messages, Message } from "../types";
import { LinkExpression } from "@perspect3vism/ad4m";
import getMessages from "../api/getMessages";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import getMessage from "../api/getMessage";
import { linkIs } from "../helpers/linkHelpers";
import deleteMessageReaction from "../api/deleteMessageReaction";
import createMessageReaction from "../api/createMessageReaction";
import createReply from "../api/createReply";
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";
import getMe from "../api/getMe";
import { DexieMessages, DexieUI } from "../helpers/storageHelpers";
import {
  DIRECTLY_SUCCEEDED_BY,
  REACTION,
} from "../constants/communityPredicates";
import hideEmbeds from "../api/hideEmbeds";
import { MAX_MESSAGES } from "../constants/general";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

type State = {
  isFetchingMessages: boolean;
  keyedMessages: Messages;
  scrollPosition?: number;
  hasNewMessage: boolean;
  isMessageFromSelf: boolean;
  showLoadMore: boolean;
};

type ContextProps = {
  state: State;
  methods: {
    loadMore: () => void;
    sendReply: (message: string, replyUrl: string) => void;
    removeReaction: (linkExpression: LinkExpression) => void;
    addReaction: (messageUrl: string, reaction: string) => void;
    sendMessage: (message: string) => void;
    saveScrollPos: (pos?: number) => void;
    setHasNewMessage: (value: boolean) => void;
    setIsMessageFromSelf: (value: boolean) => void;
    hideMessageEmbeds: (messageUrl: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    isFetchingMessages: false,
    keyedMessages: {},
    scrollPosition: 0,
    hasNewMessage: false,
    isMessageFromSelf: false,
    showLoadMore: true,
  },
  methods: {
    loadMore: () => null,
    sendReply: () => null,
    removeReaction: () => null,
    addReaction: () => null,
    sendMessage: () => null,
    saveScrollPos: () => null,
    setHasNewMessage: () => null,
    setIsMessageFromSelf: () => null,
    hideMessageEmbeds: () => null,
  },
};

const ChatContext = createContext(initialState);

let dexieUI: DexieUI;
let dexieMessages: DexieMessages;

export function ChatProvider({ perspectiveUuid, children, channelId }: any) {
  const linkSubscriberRef = useRef();

  const [state, setState] = useState(initialState.state);
  const [agent, setAgent] = useState();

  useEffect(() => {
    fetchAgent();
  }, []);

  useEffect(() => {
    if (channelId) {
      dexieUI = new DexieUI(`${perspectiveUuid}://${channelId}`);
      dexieMessages = new DexieMessages(`${perspectiveUuid}://${channelId}`);
      // Set messages to cached messages
      // so we have something before we load more
    }
  }, [channelId]);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  console.log("state  is", state);

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (perspectiveUuid && channelId && agent) {
      dexieUI.get("scroll-position").then((position) => {
        setState((oldState) => ({
          ...oldState,
          scrollPosition: parseInt(position),
        }));
      });

      fetchMessages();
    }
  }, [perspectiveUuid, channelId, agent]);

  useEffect(() => {
    if (perspectiveUuid) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current?.removeListener("link-added", handleLinkAdded);
      linkSubscriberRef.current?.removeListener(
        "link-removed",
        handleLinkAdded
      );
    };
  }, [perspectiveUuid]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
  }

  useEffect(() => {
    dexieMessages.saveAll(Object.values(state.keyedMessages));
  }, [JSON.stringify(state.keyedMessages)]);

  useEffect(() => {
    dexieUI.save("scroll-position", state.scrollPosition);
  }, [state.scrollPosition]);

  function addMessage(oldState, message) {
    const newState = {
      ...oldState,
      hasNewMessage: true,
      keyedMessages: {
        ...oldState.keyedMessages,
        [message.id]: { ...message, isNeighbourhoodCardHidden: false },
      },
    };
    return newState;
  }

  function updateMessagePopularStatus(link, status) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (!message) return oldState;

      return {
        ...oldState,
        keyedMessages: {
          ...oldState.keyedMessages,
          [id]: {
            ...message,
            isPopular: status,
          },
        },
      };
    });
  }

  function addReactionToState(link) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (message) {
        const linkFound = message.reactions.find(
          (e) => e.content === link.data.target && e.author === link.author
        );

        console.log({ linkFound, link, message });

        if (linkFound) return oldState;

        return {
          ...oldState,
          keyedMessages: {
            ...oldState.keyedMessages,
            [id]: {
              ...message,
              reactions: [
                ...message.reactions,
                {
                  author: link.author,
                  content: link.data.target.replace("emoji://", ""),
                  timestamp: link.timestamp,
                },
              ],
            },
          },
        };
      }

      return oldState;
    });
  }

  function removeReactionFromState(link) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (!message) return oldState;

      function filterReactions(reaction, link) {
        const isSameAuthor = reaction.author === link.author;
        const isSameAuthorAndContent =
          isSameAuthor &&
          reaction.content === link.data.target.replace("emoji://", "");
        return isSameAuthorAndContent ? false : true;
      }

      return {
        ...oldState,
        keyedMessages: {
          ...oldState.keyedMessages,
          [id]: {
            ...message,
            reactions: message.reactions.filter((e) =>
              filterReactions(e, link)
            ),
          },
        },
      };
    });
  }

  function addHiddenToMessageToState(
    oldState,
    messageId,
    isNeighbourhoodCardHidden
  ) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [messageId]: {
          ...oldState.keyedMessages[messageId],
          isNeighbourhoodCardHidden,
        },
      },
    };
    return newState;
  }

  async function handleLinkAdded(link) {
    const client = await getAd4mClient();

    console.log("Got message link", link);

    const agent = await getMe();

    const isMessageFromSelf = link.author === agent.did;

    const hasFocus = document.hasFocus();

    if (!isMessageFromSelf || !hasFocus) {
      if (linkIs.message(link)) {
        const isSameChannel = await client.perspective.queryProlog(
          perspectiveUuid,
          `triple("${channelId}", "${DIRECTLY_SUCCEEDED_BY}", "${link.data.target}").`
        );
        if (isSameChannel) {
          const message = getMessage(link);

          if (message) {
            setState((oldState) => addMessage(oldState, message));

            setState((oldState) => ({
              ...oldState,
              isMessageFromSelf: false,
            }));
          }
        }
      }

      if (linkIs.reaction(link)) {
        addReactionToState(link);
      }

      if (linkIs.reply(link)) {
        const isSameChannel = await client.perspective.queryProlog(
          perspectiveUuid,
          `triple("${channelId}", "${DIRECTLY_SUCCEEDED_BY}", "${link.data.source}").`
        );

        if (isSameChannel) {
          const message = getMessage(link);

          setState((oldState) => addMessage(oldState, message));

          setState((oldState) => ({
            ...oldState,
            isMessageFromSelf: false,
          }));
        }
      }

      if (linkIs.hideNeighbourhoodCard(link)) {
        const id = link.data.source;

        setState((oldState) => addHiddenToMessageToState(oldState, id, true));
      }
    }
    if (linkIs.socialDNA(link)) {
      console.log("Got new Social DNA, reloading the messages", link);
      fetchMessages();
    }
    if (linkIs.reaction(link)) {
      //TODO; this could read if the message is already popular and if so skip this check
      const isPopularPost = await client.perspective.queryProlog(
        perspectiveUuid,
        `isPopular("${link.data.source}").`
      );

      if (isPopularPost) {
        updateMessagePopularStatus(link, true);
      }
    }
  }

  async function handleLinkRemoved(link) {
    const client = await getAd4mClient();

    //TODO: link.proof.valid === false when we recive
    // the remove link somehow. Ad4m bug?
    if (link.data.predicate === REACTION) {
      const isPopularPost = await client.perspective.queryProlog(
        perspectiveUuid,
        `isPopular("${link.data.source}").`
      );

      if (!isPopularPost) {
        updateMessagePopularStatus(link, false);
      }
      removeReactionFromState(link);
    }
  }

  async function fetchMessages(from?: Date) {
    console.log("Fetch messages with from: ", from);
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    const oldMessages = {
      ...state.keyedMessages,
    };

    const { keyedMessages: newMessages, expressionLinkLength } =
      await getMessages({
        perspectiveUuid,
        channelId,
        from: from,
      });

    setState((oldState) => ({
      ...oldState,
      keyedMessages: {
        ...oldState.keyedMessages,
        ...newMessages,
      },
    }));

    setState((oldState) => ({
      ...oldState,
      showLoadMore: expressionLinkLength === MAX_MESSAGES,
      isFetchingMessages: false,
    }));
    return expressionLinkLength;
  }

  async function sendMessage(value) {
    const message = await createMessage({
      perspectiveUuid,
      lastMessage: channelId,
      message: value,
    });

    setState((oldState) => addMessage(oldState, message));
  }

  async function sendReply(message: string, replyUrl: string) {
    const link = await createReply({
      perspectiveUuid: perspectiveUuid,
      message: message,
      replyUrl,
      channelId,
    });

    setState((oldState) => addMessage(oldState, link));
  }

  async function hideMessageEmbeds(messageUrl: string) {
    const link = await hideEmbeds({
      perspectiveUuid,
      messageUrl,
    });

    const id = link.data.source;

    setState((oldState) => addHiddenToMessageToState(oldState, id, true));
  }

  async function addReaction(messageUrl: string, reaction: string) {
    console.log("addReaction");

    const link = await createMessageReaction({
      perspectiveUuid,
      messageUrl,
      reaction,
    });

    addReactionToState(link);
  }

  function setIsMessageFromSelf(isMessageFromSelf: boolean) {
    setState((oldState) => ({
      ...oldState,
      isMessageFromSelf,
    }));
  }

  async function removeReaction(linkExpression: LinkExpression) {
    console.log("removeReaction", linkExpression);
    await deleteMessageReaction({
      perspectiveUuid,
      linkExpression,
    });

    removeReactionFromState(linkExpression);
  }

  async function loadMore() {
    const oldestMessage = messages[0];
    console.log("Loading more messages with oldest timestamp", oldestMessage);
    return await fetchMessages(
      oldestMessage ? new Date(oldestMessage.timestamp) : new Date()
    );
  }

  function saveScrollPos(pos?: number) {
    setState((oldState) => ({
      ...oldState,
      scrollPosition: pos,
    }));
  }

  function setHasNewMessage(value: boolean) {
    setState((oldState) => ({
      ...oldState,
      hasNewMessage: value,
    }));
  }

  return (
    <ChatContext.Provider
      value={{
        state: { ...state, messages },
        methods: {
          loadMore,
          sendMessage,
          addReaction,
          sendReply,
          removeReaction,
          saveScrollPos,
          setHasNewMessage,
          setIsMessageFromSelf,
          hideMessageEmbeds,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
