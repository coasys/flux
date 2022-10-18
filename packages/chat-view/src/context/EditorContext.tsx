import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { createContext } from "preact";
import { ChatContext, PerspectiveContext } from "utils/react";
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
  };
};

const initialState: ContextProps = {
  state: {
    editor: null,
    value: ""
  },
  methods: {
    onSend: (message: string) => null,
  },
};

const EditorContext = createContext(initialState);

export function EditorProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);
  const {
    state: { members, channels, url, sourceUrl },
  } = useContext(PerspectiveContext);

  const {
    state: { keyedMessages },
    methods: { sendMessage, sendReply },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const currentReplyMessage = keyedMessages[currentReply];

  function handleSendMessage(value) {
    const escapedMessage = value.replace(/( |<([^>]+)>)/gi, "");

    if (escapedMessage) {
      if (currentReplyMessage) {
        sendReply(value, currentReplyMessage.id);
      } else {
        sendMessage(value);
      }

      setInputValue("");

      setCurrentReply("");

      editor.chain().focus();
    }
  }

  const setInputValue = (value: string) => {
    setState((oldState) => ({
      ...oldState,
      value
    }))
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

  const editor = useTiptapEditor({ 
    value: state.value, 
    onChange: setInputValue, 
    onSend: handleSendMessage, 
    members: mentionMembers, 
    channels: mentionChannels
  })

  useEffect(() => {
    setState((oldState) => ({
      ...oldState,
      editor
    }))
  }, [editor])

  return (
    <EditorContext.Provider
      value={{
        state,
        methods: {
          onSend: handleSendMessage
        },
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export default EditorContext;
