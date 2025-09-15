import { useRef } from "preact/hooks";

import styles from "./FileView.module.css";

//@ts-ignore
export default function FileInputComponent({ onFileUpload }) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    console.log("File:", file);
    if (!file) {
      console.log("No file selected.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent: ProgressEvent<FileReader>) => {
      const arrayBuffer = loadEvent.target?.result;
      if (arrayBuffer) {
        // Convert arrayBuffer to byteArray
        const byteArray = new Uint8Array(arrayBuffer as ArrayBuffer);
        onFileUpload(file.name, byteArray);
      }
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      className={styles.fileupload}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.current.files = event.dataTransfer.files;
      }}
      onClick={() => fileInput.current?.click()}
    >
      <input ref={fileInput} type="file" onChange={handleFileChange} />
      <j-flex direction="column" a="center" j="center" gap="200">
        <j-text>Click or Drag files here to upload</j-text>
        <j-button variant="primary">Upload</j-button>
      </j-flex>
    </div>
  );
}
