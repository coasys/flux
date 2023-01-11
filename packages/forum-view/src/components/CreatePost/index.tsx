import { useRef, useState, useEffect, useMemo } from "preact/hooks";
import Editor from "../Editor";
import { PostOption, postOptions } from "../../constants/options";
import FileUpload from "../../components/FileUpload";
import { parse } from "date-fns/esm";
import styles from "./index.scss";
import PostModel from "utils/api/post";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "utils/helpers/profileHelpers";
import PostImagePreview from "../PostImagePreview";

const initialState = {
  title: null,
  body: null,
  url: null,
  image: null,
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null,
  options: [],
};

export default function CreatePost({
  postId,
  channelId,
  communityId,
  onPublished,
  onCancel,
  initialType,
}) {
  const inputRefs = useRef<{ [x: string]: { isValid: boolean; el: any } }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);
  const [entryType, setEntryType] = useState<PostOption>(initialType);
  const [state, setState] = useState(initialState);
  const isEditing = !!postId;

  const Post = useMemo(() => {
    return new PostModel({ perspectiveUuid: communityId, source: channelId });
  }, [communityId, channelId]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current.title?.el.focus();
    }, 100);
  }, []);

  // Fetch post if editing
  useEffect(() => {
    if (postId) {
      const Model = new PostModel({
        perspectiveUuid: communityId,
        source: channelId,
      });
      Model.get(postId).then((entry: any) => {
        setState(entry);
        setIsLoading(false);

        // FIX - Better post type detection
        if (entry?.image) {
          setEntryType(PostOption.Image);
        }
        if (entry?.url) {
          setEntryType(PostOption.Link);
        }

        console.log("entry: ", entry);
      });
    }
  }, [postId]);

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

    let data = state;
    let newPost = undefined;

    if (entryType === PostOption.Event) {
      const startDate = parseDateTime(
        state.startDate,
        state.startTime
      ).toISOString();
      const endDate = parseDateTime(state.endDate, state.endTime).toISOString();
      data = {
        ...state,
        startDate,
        endDate,
      };
    }

    try {
      if (isEditing) {
        await Post.update(postId, data);
      } else {
        newPost = await Post.create(data);
      }
      onPublished(isEditing ? postId : newPost?.id);
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

    const FR = new FileReader();
    FR.addEventListener("load", async function (evt) {
      const compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(evt.target.result as string), 0.6)
      );

      setState({
        ...state,
        image: compressedImage,
      });
    });

    FR.readAsDataURL(files[0]);
  }

  const showBody = true;
  const showUrl = entryType === PostOption.Link;
  const showStartDate = entryType === PostOption.Event;
  const showEndDate =
    entryType === PostOption.Event && state.startDate && state.startTime;
  const showImage = entryType === PostOption.Image;

  return (
    <div class={styles.createPost}>
      <j-box px="400" py="600">
        <j-box pb="600">
          <j-text color="black" size="600" weight="600">
            {isEditing ? "Edit post" : "Create a Post"}
          </j-text>
        </j-box>
        <j-box pt="500" pb="200">
          <j-tabs
            full
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
          >
            {postOptions.map((option) => {
              return (
                <j-tab-item
                  variant="button"
                  size="sm"
                  value={option.value}
                  disabled={isEditing}
                >
                  <j-icon slot="start" size="md" name={option.icon}></j-icon>
                  {option.label}
                </j-tab-item>
              );
            })}
          </j-tabs>
        </j-box>
        <j-box mt="800">
          <j-flex direction="column" gap="400">
            <j-box pb="500">
              <j-input
                class={styles.titleInput}
                required
                autovalidate
                ref={(ref) => setInputRef(ref, "title")}
                placeholder="Add a Title"
                onInput={handleChange}
                value={state.title}
                size="xl"
                name="title"
              ></j-input>
            </j-box>
            {showUrl && (
              <j-box pb="500">
                <j-input
                  ref={(ref) => setInputRef(ref, "url")}
                  autovalidate
                  size="xl"
                  name="url"
                  placeholder="Url"
                  onInput={handleChange}
                  value={state.url}
                  required
                  type="url"
                ></j-input>
              </j-box>
            )}
            {showImage && (
              <j-box pt="300">
                {isEditing && state.image ? (
                  <PostImagePreview
                    imageUrl={state.image}
                    onRemove={() => setState({ ...state, image: undefined })}
                  />
                ) : (
                  <FileUpload onChange={handleImage}></FileUpload>
                )}
              </j-box>
            )}
            {showBody && (
              <Editor
                style={{ minHeight: "200px" }}
                initialContent={state.body}
                onChange={(e) =>
                  setState((oldState) => ({ ...oldState, body: e }))
                }
              ></Editor>
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
          </j-flex>
        </j-box>
        <j-box mt="700">
          <j-flex direction="row" j="end" gap="300">
            <j-button onClick={() => onCancel()} size="lg" variant="link">
              Cancel
            </j-button>
            <j-button
              loading={isCreating}
              disabled={isCreating || isLoading}
              onClick={() => publish()}
              size="lg"
              variant="primary"
            >
              {isEditing ? "Update" : "Publish"}
            </j-button>
          </j-flex>
        </j-box>
      </j-box>
    </div>
  );
}
