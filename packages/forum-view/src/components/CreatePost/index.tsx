import { useRef, useState, useEffect } from "preact/hooks";
import { EntryType } from "utils/types";
import Editor from "../Editor";
import createPost from "utils/api/createPost";
import { postOptions } from "../../constants/options";
import FileUpload from "../../components/FileUpload";
import { format } from "date-fns";
import { parse } from "date-fns/esm";

const initialState = {
  title: "",
  body: "",
  url: "",
  image: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  startTime: "",
  endDate: "",
  endTime: "",
  options: [],
};

export default function MakeEntry({
  channelId,
  communityId,
  onPublished,
  initialType,
}) {
  const inputRefs = useRef<{ [x: string]: { isValid: boolean; el: any } }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>(initialType);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current.title?.el.focus();
    }, 100);
  }, []);

  // We set dynamic refs based on the input name
  // When an inputfield is hidden we remove it
  // Save info about the validity so we can validate the whole form
  function setInputRef(ref, name) {
    if (ref) {
      inputRefs.current = {
        ...inputRefs.current,
        [name]: { el: ref, isValid: false },
      };
    } else {
      delete inputRefs.current[name];
    }
  }

  function validateAllInputs() {
    return Object.values(inputRefs.current).every((ref) => {
      return ref.el.validate();
    });
  }

  function parseDateTime(date: string, time: string) {
    if (date && time) {
      return parse(`${date}-${time}`, "yyyy-MM-dd-HH:mm", new Date());
    } else {
      return new Date();
    }
  }

  async function publish() {
    const canSubmit = validateAllInputs();
    if (!canSubmit) return;

    setIsCreating(true);

    const startDate = parseDateTime(state.startDate, state.startTime);
    const endDate = parseDateTime(state.endDate, state.endTime);

    try {
      await createPost({
        channelId,
        communityId,
        type: entryType,
        data: {
          ...state,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
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

  function handleImage(files: any) {
    if (!files || !files[0]) return;
    console.log(files[0]);
    const FR = new FileReader();
    FR.addEventListener("load", function (evt) {
      console.log(evt.target.result);
      setState({
        ...state,
        image: evt.target.result,
      });
    });
    FR.readAsDataURL(files[0]);
  }

  const showBody =
    entryType === EntryType.SimplePost || entryType === EntryType.CalendarEvent;
  const showUrl = entryType === EntryType.LinkPost;
  const showStartDate = entryType === EntryType.CalendarEvent;
  const showEndDate =
    entryType === EntryType.CalendarEvent && state.startDate && state.startTime;
  const showImage = entryType === EntryType.ImagePost;

  return (
    <j-box p="800">
      <j-text variant="heading-sm" nomargin>
        Create a New Post
      </j-text>
      <j-box pt="800" pb="200">
        <j-tabs
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
        >
          {postOptions.map((option) => {
            return (
              <j-tab-item size="sm" value={option.value} variant="button">
                <j-icon slot="start" size="sm" name={option.icon}></j-icon>
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
            autovalidate
            ref={(ref) => setInputRef(ref, "title")}
            label="Title"
            onInput={handleChange}
            value={state.title}
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
              ref={(ref) => setInputRef(ref, "url")}
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
            <j-flex a="end" gap="400">
              <j-input
                full
                autovalidate
                ref={(ref) => setInputRef(ref, "startDate")}
                required
                name="startDate"
                value={state.startDate}
                onInput={handleChange}
                label="Start"
                type="date"
              ></j-input>
              <j-input
                full
                autovalidate
                required
                ref={(ref) => setInputRef(ref, "startTime")}
                name="startTime"
                value={state.startTime}
                onInput={handleChange}
                label=""
                type="time"
              ></j-input>
            </j-flex>
          )}
          {showEndDate && (
            <j-flex a="end" gap="400">
              <j-input
                full
                autovalidate
                required
                name="endDate"
                ref={(ref) => setInputRef(ref, "endDate")}
                min={state.startDate}
                value={state.endDate}
                onInput={handleChange}
                label="End"
                type="date"
              ></j-input>
              <j-input
                full
                autovalidate
                required
                name="endTime"
                ref={(ref) => setInputRef(ref, "endTime")}
                list="time_list"
                min={state.startDate === state.endDate ? state.startTime : ""}
                max={state.startDate === state.endDate ? "23:59" : ""}
                value={state.endTime}
                onInput={handleChange}
                label=""
                type="time"
              ></j-input>
            </j-flex>
          )}
          {showImage && (
            <j-box pt="300">
              <j-text variant="label">Image</j-text>
              <FileUpload onChange={handleImage}></FileUpload>
            </j-box>
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
