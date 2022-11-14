import { useRef, useState, useEffect } from "preact/hooks";
import {
  BODY,
  TITLE,
  IMAGE,
  START_DATE,
  END_DATE,
} from "utils/constants/communityPredicates";
import { EntryType } from "utils/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { createEntry } from "utils/api/createEntry";

async function createEntryData({ entryType, data }) {
  console.log("create entrydata");
  const client = await getAd4mClient();
  console.log("got client");
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
        [IMAGE]: data.image,
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

export default function MakeEntry({ channelId, communityId, onPublished }) {
  const inputRef = useRef(null);
  const [entryType, setEntryType] = useState(EntryType.SimplePost);
  const [state, setState] = useState({
    title: "",
    body: "",
    url: "",
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
    const data = await createEntryData({ entryType, data: state });
    console.log({
      perspectiveUuid: communityId,
      source: channelId,
      types: [entryType],
      data,
    });
    const entry = await createEntry({
      perspectiveUuid: communityId,
      source: channelId,
      types: [entryType],
      data,
    }).then(onPublished);
  }

  function handleChange(e: any) {
    setState({ ...state, [e.target.name]: e.target.value });
  }

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
          <j-tab-item size="sm" value={EntryType.PollPost} variant="button">
            <j-icon slot="start" name="card-list"></j-icon>
            Poll
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
            placeholder="Title"
          ></j-input>
          <j-input
            required
            label="Body"
            name="body"
            onInput={handleChange}
            value={state.body}
            size="xl"
            placeholder="Text"
          ></j-input>
          {entryType === EntryType.CalendarEvent && (
            <>
              <j-input
                required
                name="startDate"
                onInput={handleChange}
                label="Start"
                type="datetime-local"
              ></j-input>
              <j-input
                required
                name="endDate"
                onInput={handleChange}
                label="End"
                type="datetime-local"
              ></j-input>
            </>
          )}
          {entryType === EntryType.ImagePost && (
            <>
              <j-text variant="label">Image</j-text>
              <input
                required
                value={state.image}
                name="image"
                onChange={handleChange}
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
          <j-button onClick={() => publish()} size="lg" variant="primary">
            Post
          </j-button>
        </j-flex>
      </j-box>
    </j-box>
  );
}
