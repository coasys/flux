import React, {
  createContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Messages, Message, EntryType } from "../types";
import { LinkExpression, Literal, PerspectiveProxy } from "@perspect3vism/ad4m";
import getMessages from "../api/getMessages";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import getMessage from "../api/getMessage";
import { linkIs } from "../helpers/linkHelpers";
import deleteMessageReaction from "../api/deleteMessageReaction";
import createMessageReaction from "../api/createMessageReaction";
import createReply from "../api/createReply";
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";
import getMe, { Me } from "../api/getMe";
import { REACTION } from "../constants/communityPredicates";
import hideEmbeds from "../api/hideEmbeds";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import editCurrentMessage from "../api/editCurrentMessage";
import { DEFAULT_LIMIT } from "../constants/sdna";
import { checkUpdateSDNAVersion } from "../api/updateSDNA";
import { LinkCallback } from "@perspect3vism/ad4m/lib/src/perspectives/PerspectiveClient";

type State = {
  communityId: string;
  channelId: string;
  isFetchingMessages: boolean;
  keyedMessages: Messages;
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
    editMessage: (message: string, editedMesage: string) => void;
    setHasNewMessage: (value: boolean) => void;
    setIsMessageFromSelf: (value: boolean) => void;
    hideMessageEmbeds: (messageUrl: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
    isFetchingMessages: false,
    keyedMessages: {},
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
    editMessage: () => null,
    setHasNewMessage: () => null,
    setIsMessageFromSelf: () => null,
    hideMessageEmbeds: () => null,
  },
};

const ChatContext = createContext(initialState);

export function ChatProvider({ perspectiveUuid, children, channelId }: any) {
  const linkSubscriberRef = useRef<Function | null>();

  const [state, setState] = useState(initialState.state);

  const [agent, setAgent] = useState<Me>();

  useEffect(() => {
    fetchAgent();
  }, []);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = useMemo(
    () => sortExpressionsByTimestamp(state.keyedMessages, "asc"),
    [state.keyedMessages]
  );

  useEffect(() => {
    if (perspectiveUuid && channelId && agent) {
      fetchMessages();
    }
  }, [perspectiveUuid, channelId, agent]);

  useEffect(() => {
    if (perspectiveUuid) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current && linkSubscriberRef.current();
    };
  }, [perspectiveUuid]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
  }

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

  function addEditMessage(oldState, oldMessage, message) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [oldMessage]: {
          ...oldState.keyedMessages[oldMessage],
          editMessages: [
            ...oldState.keyedMessages[oldMessage].editMessages,
            message,
          ],
        },
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

    const agent = await getMe();

    const isMessageFromSelf = link.author === agent.did;

    //const hasFocus = document.hasFocus();

    const isSameChannel = await client.perspective.queryProlog(
      perspectiveUuid,
      `triple("${channelId}", "${EntryType.Message}", "${link.data.target}").`
    );

    if (linkIs.message(link) && isSameChannel) {
      const message = getMessage(link);

      if (message) {
        setState((oldState) =>
          addMessage(oldState, { ...message, synced: true })
        );

        setState((oldState) => ({
          ...oldState,
          isMessageFromSelf,
        }));
      }
    }

    if (linkIs.reaction(link) && isSameChannel) {
      addReactionToState(link);
    }

    if (linkIs.editedMessage(link) && isSameChannel) {
      const message = Literal.fromUrl(link.data.target).get();
      setState((oldState) =>
        addEditMessage(oldState, link.data.source, {
          author: link.author,
          content: message.data,
          timestamp: link.timestamp,
        })
      );
    }

    if (linkIs.reply(link) && isSameChannel) {
      const message = getMessage(link);

      setState((oldState) =>
        addMessage(oldState, { ...message, synced: true })
      );

      setState((oldState) => ({
        ...oldState,
        isMessageFromSelf,
      }));
    }

    if (linkIs.hideNeighbourhoodCard(link) && isSameChannel) {
      const id = link.data.source;

      setState((oldState) => addHiddenToMessageToState(oldState, id, true));
    }

    if (linkIs.socialDNA(link)) {
      console.warn("got new social dna fetching messages again");
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

  async function fetchMessages(from?: Date, backwards?: boolean) {
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    let newMessages;
    let expressionLinkLength;
    try {
      const data = await getMessages({
        perspectiveUuid,
        channelId,
        from: from,
        backwards,
      });
      newMessages = data.keyedMessages;
      expressionLinkLength = data.expressionLinkLength;
    } catch (e) {
      if (e.message.includes("existence_error")) {
        console.error(
          "We dont have the SDNA to make this query, please wait for community to sync"
        );
        await checkUpdateSDNAVersion(perspectiveUuid, new Date());
        throw e;
      } else {
        throw e;
      }
    }

    setState((oldState) => ({
      ...oldState,
      showLoadMore: expressionLinkLength === DEFAULT_LIMIT || backwards,
      isFetchingMessages: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        ...newMessages,
      },
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

  async function editMessage(message, editedMessage) {
    const res = await editCurrentMessage({
      perspectiveUuid,
      lastMessage: message,
      message: editedMessage,
    });

    setState((oldState) =>
      addEditMessage(oldState, message, {
        author: res.author,
        content: res.content,
        timestamp: res.timestamp,
      })
    );
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
    await deleteMessageReaction({
      perspectiveUuid,
      linkExpression,
    });

    removeReactionFromState(linkExpression);
  }

  async function loadMore(timestamp: Date, backwards: boolean) {
    if (backwards) {
      return await fetchMessages(new Date(timestamp), backwards);
    } else {
      const oldestMessage = messages[0];

      return await fetchMessages(
        oldestMessage ? new Date(oldestMessage.timestamp) : new Date()
      );
    }
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
        state: { ...state, messages, communityId: perspectiveUuid, channelId },
        methods: {
          loadMore,
          sendMessage,
          addReaction,
          sendReply,
          removeReaction,
          setHasNewMessage,
          setIsMessageFromSelf,
          hideMessageEmbeds,
          editMessage,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
