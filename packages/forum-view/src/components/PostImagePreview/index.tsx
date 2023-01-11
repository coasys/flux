import { useEffect, useState } from "preact/hooks";
import { getImage } from "utils/helpers/getImage";
import styles from "./index.module.css";

type Props = {
  imageUrl?: string;
  onRemove: () => void;
};

export default function PostImagePreview({ imageUrl, onRemove }: Props) {
  const [base64, setBase64] = useState("");

  async function fetchImage(imageUrl) {
    const image = await getImage(imageUrl);
    setBase64(image);
  }

  useEffect(() => {
    if (imageUrl) {
      fetchImage(imageUrl);
    }
  }, [imageUrl]);

  return (
    <section className={styles.preview}>
      <div className={styles.files}>
        <div className={styles.file}>
          <img class={styles.filePreview} src={base64} />

          <j-button
            class={styles.removeButton}
            square
            variant="ghost"
            onClick={() => onRemove()}
          >
            Remove
          </j-button>
        </div>
      </div>
    </section>
  );
}
