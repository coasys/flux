import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import { createContext } from "preact";
import {
  AgentContext,
  ChatContext,
  CommunityContext,
} from "@fluxapp/react-web";
import UIContext from "./UIContext";
import useTiptapEditor from "../components/TipTap/useTiptapEditor";
import { Editor } from "@tiptap/core";

type State = {
  editor: Editor;
  value: string;
};

type ContextProps = {
  state: State;
  methods: {
    onSend: (message: string) => void;
    setInputValue: (value: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    editor: null,
    value: "",
  },
  methods: {
    onSend: (message: string) => null,
    setInputValue: (value: string) => null,
  },
};

const EditorContext = createContext(initialState);

export function EditorProvider({ children, perspectiveUuid, channelId }: any) {
  const [state, setState] = useState(initialState.state);
  const {
    state: { members, channels },
  } = useContext(CommunityContext);

  const {
    state: { keyedMessages, messages },
    methods: { sendMessage, sendReply, editMessage },
  } = useContext(ChatContext);

  const {
    state: { currentReply, currentMessageEdit },
    methods: { setCurrentReply, setCurrentEditMessage },
  } = useContext(UIContext);

  const { state: agentState } = useContext(AgentContext);

  const currentReplyMessage = keyedMessages[currentReply];

  const setInputValue = (value: string) => {
    setState((oldState) => ({
      ...oldState,
      value,
    }));
  };

  async function handleSendMessage(value) {
    const escapedMessage = value.replace(/( |<([^>]+)>)/gi, "");

    if (escapedMessage) {
      if (currentReplyMessage) {
        sendReply(value, currentReplyMessage.id);
      } else if (currentMessageEdit) {
        editMessage(currentMessageEdit, value);
      } else {
        sendMessage(value);
      }

      // editor.chain().clearContent(true);

      setInputValue("");

      setCurrentReply("");

      setCurrentEditMessage("");

      editor.chain().focus();
    }
  }

  const mentionMembers = useMemo(() => {
    return Object.values(members).map((user: any) => {
      return {
        label: user.username,
        id: user.did,
        trigger: "@",
      };
    });
  }, [members]);

  const mentionChannels = useMemo(() => {
    return Object.values(channels).map((channel: any) => {
      return {
        label: channel.name,
        id: channel.id,
        trigger: "#",
      };
    });
  }, [channels]);

  const onMessageEdit = useCallback(() => {
    if (messages.length) {
      const message = messages.findLast(
        (message) => message.author === agentState.did
      );
      if (message) {
        setCurrentEditMessage(message.id);
        setInputValue(
          message.editMessages[message.editMessages.length - 1].content
        );
      }
    }
  }, [setCurrentEditMessage, messages]);

  const editor = useTiptapEditor({
    value: state.value,
    onChange: setInputValue,
    onSend: handleSendMessage,
    members: mentionMembers,
    channels: mentionChannels,
    channelId,
    perspectiveUuid,
    currentMessageEdit,
    onMessageEdit,
  });

  useEffect(() => {
    setState((oldState) => ({
      ...oldState,
      editor,
    }));
  }, [editor]);

  return (
    <EditorContext.Provider
      value={{
        state,
        methods: {
          onSend: handleSendMessage,
          setInputValue: setInputValue,
        },
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export default EditorContext;
