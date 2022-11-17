import { useRef, useState, useEffect } from "preact/hooks";
import { EntryType } from "utils/types";
import Editor from "./Editor";
import createPost from "utils/api/createPost";
import { postOptions } from "../../constants/options";

export default function MakeEntry({
  channelId,
  communityId,
  onPublished,
  initialType,
}) {
  const inputRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false);
  const [entryType, setEntryType] = useState(initialType);
  const [state, setState] = useState({
    title: "",
    body: "",
    url: "",
    imagePath: "",
    image: "",
    startDate: "",
    endDate: "",
    options: [],
  });

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  async function publish() {
    setIsCreating(true);
    try {
      await createPost({
        channelId,
        communityId,
        type: entryType,
        data: state,
      });
      onPublished(true);
    } catch (e) {
      console.log(e);
    } finally {
      setIsCreating(false);
    }
  }

  function handleChange(e: any) {
    setState({ ...state, [e.target.name]: e.target.value });
  }

  function handleImage(e: any) {
    const target = e.target;
    if (!target.files || !target.files[0]) return;
    const FR = new FileReader();
    FR.addEventListener("load", function (evt) {
      const img = document.createElement("img");
      img.src = evt.target.result;
      setState({
        ...state,
        imagePath: e.target.value,
        image: evt.target.result,
      });
    });
    FR.readAsDataURL(target.files[0]);
  }

  const showBody =
    entryType === EntryType.SimplePost || entryType === EntryType.CalendarEvent;
  const showUrl = entryType === EntryType.LinkPost;
  const showStartDate = entryType === EntryType.CalendarEvent;
  const showEndDate = entryType === EntryType.CalendarEvent;
  const showImage = entryType === EntryType.ImagePost;

  return (
    <j-box p="800">
      <j-text variant="heading-sm" nomargin>
        Create a New Post
      </j-text>
      <j-box pt="500" pb="500">
        <j-tabs
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
        >
          {postOptions.map((option) => {
            return (
              <j-tab-item size="sm" value={option.value} variant="button">
                <j-icon slot="start" name={option.icon}></j-icon>
                {option.label}
              </j-tab-item>
            );
          })}
        </j-tabs>
      </j-box>
      <j-box mt="500">
        <j-flex direction="column" gap="300">
          <j-input
            required
            label="Title"
            onInput={handleChange}
            value={state.title}
            ref={inputRef}
            size="xl"
            name="title"
          ></j-input>

          {showBody && (
            <Editor
              onChange={(e) =>
                setState((oldState) => ({ ...oldState, body: e }))
              }
            ></Editor>
          )}
          {showUrl && (
            <j-input
              label="Url"
              autovalidate
              size="xl"
              name="url"
              onInput={handleChange}
              value={state.url}
              required
              type="url"
            ></j-input>
          )}
          {showStartDate && (
            <j-input
              required
              name="startDate"
              onInput={handleChange}
              label="Start"
              type="datetime-local"
            ></j-input>
          )}
          {showEndDate && (
            <j-input
              required
              name="endDate"
              onInput={handleChange}
              label="End"
              type="datetime-local"
            ></j-input>
          )}
          {showImage && (
            <>
              <j-text variant="label">Image</j-text>
              <input
                required
                value={state.image}
                name="image"
                onChange={handleImage}
                type="file"
              />
            </>
          )}
        </j-flex>
      </j-box>
      <j-box mt="500">
        <j-flex direction="row" j="end" gap="300">
          <j-button size="lg" variant="link">
            Cancel
          </j-button>
          <j-button
            loading={isCreating}
            disabled={isCreating}
            onClick={() => publish()}
            size="lg"
            variant="primary"
          >
            Post
          </j-button>
        </j-flex>
      </j-box>
    </j-box>
  );
}
