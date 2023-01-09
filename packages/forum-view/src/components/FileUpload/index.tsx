import { useEffect, useState } from "preact/hooks";
import { useDropzone } from "react-dropzone";
import styles from "./index.scss";

type FluxFile = File & {
  preview: string;
};

type Props = {
  onChange: (files: FluxFile[]) => void;
};

export default function FileUpload({ onChange }: Props) {
  const [files, setFiles] = useState<FluxFile[]>([]);
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
      <img
        class={styles.filePreview}
        src={file.preview}
        // Revoke data uri after image is loaded
        onLoad={() => {
          URL.revokeObjectURL(file.preview);
        }}
      />

      <j-button
        class={styles.removeButton}
        square
        variant="ghost"
        onClick={() => setFiles([])}
      >
        Remove
      </j-button>
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
          <j-button>
            <j-icon name="upload"></j-icon>
            Choose or drag and drop an image
          </j-button>
        </div>
      ) : (
        <div className={styles.files}>{thumbs}</div>
      )}
    </section>
  );
}
