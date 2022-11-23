import { useEffect, useState } from "preact/hooks";
import { useDropzone } from "react-dropzone";
import styles from "./index.scss";

const thumbsContainer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 16,
};

const thumb = {
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

export default function Previews({ onChange }) {
  const [files, setFiles] = useState([]);
  const { getRootProps, getInputProps, isFocused } = useDropzone({
    maxFiles: 1,
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  useEffect(() => {
    onChange(files);
  }, [files]);

  const thumbs = files.map((file) => (
    <div className={styles.file} key={file.name}>
      <div className={styles.fileImage}>
        <img
          src={file.preview}
          // Revoke data uri after image is loaded
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
        />
      </div>
      <div>
        <j-flex j="between">
          <div>{file.name}</div>
          <j-button square variant="ghost" onClick={() => setFiles([])}>
            Remove
          </j-button>
        </j-flex>
      </div>
    </div>
  ));

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  const dropZoneStyles = [
    styles.dropZone,
    isFocused ? styles.isFocused : "",
  ].join(" ");

  return (
    <section className={styles.fileUpload}>
      {files.length < 1 ? (
        <div
          {...getRootProps({
            className: dropZoneStyles,
          })}
        >
          <input {...getInputProps()} />
          <j-button variant="primary">Select image</j-button>
          <p>Drag 'n' drop an image here</p>
        </div>
      ) : (
        <div className={styles.files}>{thumbs}</div>
      )}
    </section>
  );
}
