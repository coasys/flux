import { useRef, useState, useEffect } from "preact/hooks";
import {
  BODY,
  TITLE,
  IMAGE,
  START_DATE,
  END_DATE,
  URL,
} from "utils/constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import { EntryType } from "utils/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { createEntry } from "utils/api/createEntry";
import Editor from "./Editor";

async function createEntryData({ entryType, data }) {
  const client = await getAd4mClient();
  const expression = client.expression;

  switch (entryType) {
    case EntryType.SimplePost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [BODY]: await expression.create(data.body, "literal"),
      };
    case EntryType.ImagePost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [IMAGE]: await expression.create(
          data.image,
          NOTE_IPFS_EXPRESSION_OFFICIAL
        ),
      };
    case EntryType.LinkPost:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [URL]: await expression.create(data.url, "literal"),
      };
    case EntryType.CalendarEvent:
      return {
        [TITLE]: await expression.create(data.title, "literal"),
        [BODY]: await expression.create(data.body, "literal"),
        [START_DATE]: await expression.create(data.startDate, "literal"),
        [END_DATE]: await expression.create(data.endDate, "literal"),
      };
  }
}

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
      const data = await createEntryData({ entryType, data: state });
      await createEntry({
        perspectiveUuid: communityId,
        source: channelId,
        types: [entryType],
        data,
      }).then(onPublished);
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

  const showBody = entryType === EntryType.SimplePost;
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
          <j-tab-item size="sm" value={EntryType.SimplePost} variant="button">
            <j-icon slot="start" name="card-heading"></j-icon>
            Post
          </j-tab-item>
          <j-tab-item size="sm" value={EntryType.ImagePost} variant="button">
            <j-icon slot="start" name="card-image"></j-icon>
            Image
          </j-tab-item>
          <j-tab-item size="sm" value={EntryType.LinkPost} variant="button">
            <j-icon slot="start" name="link"></j-icon>
            Url
          </j-tab-item>
          <j-tab-item
            size="sm"
            value={EntryType.CalendarEvent}
            variant="button"
          >
            <j-icon slot="start" name="calendar-date"></j-icon>
            Event
          </j-tab-item>
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

          {showBody && <Editor></Editor>}
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
