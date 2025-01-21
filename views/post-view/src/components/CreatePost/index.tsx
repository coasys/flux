import { Post as PostSubject, SubjectRepository } from "@coasys/flux-api";
import { blobToDataURL, dataURItoBlob, resizeImage } from "@coasys/flux-utils";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { PostOption, postOptions } from "../../constants/options";
import FileUpload from "../FileUpload";
import PostImagePreview from "../PostImagePreview";
import styles from "./index.module.css";

const initialState = {
  title: null,
  body: null,
  url: null,
  image: null,
};

export default function CreatePost({
  postId,
  source,
  agent,
  perspective,
  onPublished,
  onCancel,
  initialType,
}) {
  const inputRefs = useRef<{ [x: string]: { isValid: boolean; el: any } }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [imageReplaced, setImageReplaced] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);
  const [entryType, setEntryType] = useState<PostOption>(initialType);
  const [state, setState] = useState(initialState);
  const [initState, setInitState] = useState(initialState);
  const isEditing = !!postId;

  const Post = useMemo(() => {
    return new SubjectRepository(PostSubject, {
      perspective: perspective,
      source: source,
    });
  }, [perspective.uuid, source]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current.title?.el.focus();
    }, 100);
  }, []);

  // Fetch post if editing
  useEffect(() => {
    if (postId) {
      Post.getData(postId).then((entry) => {
        setState({
          title: entry.title || undefined,
          body: entry.body || undefined,
          url: entry.url || undefined,
          image: entry.image || undefined,
        });
        setInitState(entry);
        setIsLoading(false);

        // FIX - Better post type detection
        if (entry?.image) {
          setEntryType(PostOption.Image);
        }
        if (entry?.url) {
          setEntryType(PostOption.Link);
        }
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

  async function publish() {
    const canSubmit = validateAllInputs();
    if (!canSubmit) return;

    setIsCreating(true);

    let data = state;

    let newPost = undefined;

    try {
      if (isEditing) {
        await Post.update(postId, {
          ...data,
          // if we send in null the property does not get updated
          image: imageReplaced ? data.image : undefined,
        });
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

      setImageReplaced(isEditing);

      setState({
        ...state,
        image: {
          data_base64: compressedImage,
          name: "form-image",
          file_type: "image/png",
        },
      });
    });

    FR.readAsDataURL(files[0]);
  }

  function onEditorChange(e) {
    const html = e.detail.html;
    setState({ ...state, body: html });
  }

  const showBody = true;
  const showUrl = entryType === PostOption.Link;
  const showImage = entryType === PostOption.Image;

  return (
    <div className={styles.createPost}>
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
              <input
                className={styles.titleInput}
                required
                placeholder="Add a Title"
                onChange={handleChange}
                value={state.title}
                name="title"
              ></input>
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
                    imageUrl={!imageReplaced && state.image}
                    base64={imageReplaced && state.image}
                    onRemove={() => setState({ ...state, image: undefined })}
                  />
                ) : (
                  <FileUpload onChange={handleImage}></FileUpload>
                )}
              </j-box>
            )}
            {showBody && (
              <flux-editor
                agent={agent}
                perspective={perspective}
                source={source}
                className={styles.editor}
                onChange={onEditorChange}
              ></flux-editor>
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
