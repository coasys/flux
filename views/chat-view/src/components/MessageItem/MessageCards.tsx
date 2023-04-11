import { useEffect, useState } from "preact/hooks";
import styles from "./index.module.css";
import getMetaFromNeighbourhood from "utils/helpers/getNeighbourhoodMeta";
import { NeighbourhoodMetaData } from "utils/types";

async function isValidUrl(urlString) {
  try {
    await new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

export async function findURLs(str: string) {
  const URLregexp = /<a[^>]+href="([^"]*)"[^>]*>/gm;

  const urlTokens = Array.from(str.matchAll(URLregexp));

  return await Promise.all(
    urlTokens.filter((match) => isValidUrl(match[1])).map((m) => m[1])
  );
}

export default function MessageCards({ message, perspectiveUuid, mainRef }) {
  const messageContent =
    message.editMessages[message.editMessages.length - 1].content;

  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    getUrls();
  }, [message.id]);

  const getUrls = async () => {
    const urls = await findURLs(messageContent);
    setUrls(urls);
  };

  return (
    <div className={styles.MessageCardsContentWrapper}>
      {urls.map((url) =>
        url.startsWith("neighbourhood://") ? (
          <NeighbourhoodCard url={url} />
        ) : (
          <LinkCard url={url} />
        )
      )}
    </div>
  );
}

function LinkCard({ url }) {
  const [isLoading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{
    name: string;
    description: string;
    image: string;
  }>(null);

  function onClick() {
    window.open(url, "_blank");
  }

  useEffect(() => {
    fetch("https://jsonlink.io/api/extract?url=" + url)
      .then((res) => res.json())
      .then((json) => {
        if (!json) return;
        setMeta({
          name: json?.title || json?.url || url,
          description: json?.description,
          image: json?.images?.length ? json.images[0] : "",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  return (
    <div className={styles.neighbourhoodCard} onClick={onClick}>
      <div>
        <div className={styles.neighbourhoodCardFlex}>
          <div>
            <div className={styles.neighbourhoodCardName}>
              {isLoading ? (
                <j-skeleton width="lg" height="text"></j-skeleton>
              ) : (
                meta?.name || "No title"
              )}
            </div>
            <div className={styles.neighbourhoodCardDescription}>
              {isLoading ? (
                <j-skeleton width="xxl" height="text"></j-skeleton>
              ) : (
                meta?.description || "No descriptioon"
              )}
            </div>
          </div>
          {meta?.image && (
            <img
              className={styles.neighbourhoodCardImage}
              src={meta?.image}
              width={140}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NeighbourhoodCard({ url }) {
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<NeighbourhoodMetaData>(null);

  useEffect(() => {
    getMetaFromNeighbourhood(url)
      .then((res) => {
        setMeta(res);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [url]);

  function onClick(e: Event) {
    const event = new CustomEvent("neighbourhood-click", {
      detail: { url, channel: "Home" },
      bubbles: true,
    });
    e.target.dispatchEvent(event);
  }

  return (
    <div className={styles.neighbourhoodCard} size="300" onClick={onClick}>
      <div>
        <div className={styles.neighbourhoodCardFlex}>
          <div>
            <div className={styles.neighbourhoodCardName}>
              {isLoading ? (
                <j-skeleton width="lg" height="text"></j-skeleton>
              ) : (
                meta.name || "No title"
              )}
            </div>
            <div className={styles.neighbourhoodCardDescription}>
              {isLoading ? (
                <j-skeleton width="xxl" height="text"></j-skeleton>
              ) : (
                meta.description || "No descriptioon"
              )}
            </div>
          </div>
        </div>
      </div>
      <j-button variant="primary">Join</j-button>
    </div>
  );
}
