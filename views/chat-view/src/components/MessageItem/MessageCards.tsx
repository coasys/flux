import { useEffect, useState } from "preact/hooks";
import styles from "./index.module.css";
import { getMetaFromNeighbourhood } from "@fluxapp/utils";
import { NeighbourhoodMetaData } from "@fluxapp/types";

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
      {urls.map((url) => {
        if (url.startsWith("neighbourhood://"))
          return <NeighbourhoodCard url={url} />;
        if (url.startsWith("http")) return <LinkCard url={url} />;
        return null;
      })}
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
    <a className={styles.card} target="_blank" href={url}>
      <div className={styles.cardContent}>
        <div className={styles.cardName}>
          {isLoading ? (
            <j-skeleton width="lg" height="text"></j-skeleton>
          ) : (
            meta?.name || "No title"
          )}
        </div>
        <div className={styles.cardDescription}>
          {isLoading ? (
            <j-skeleton width="xxl" height="text"></j-skeleton>
          ) : (
            meta?.description || "No descriptioon"
          )}
        </div>
      </div>
      {meta?.image && (
        <div>
          <img className={styles.cardImage} src={meta?.image} />
        </div>
      )}
    </a>
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

  return (
    <a className={styles.card} href={url}>
      <div className={styles.cardContent}>
        <div className={styles.cardName}>
          {isLoading ? (
            <j-skeleton width="lg" height="text"></j-skeleton>
          ) : (
            meta.name || "No title"
          )}
        </div>
        <div className={styles.cardDescription}>
          {isLoading ? (
            <j-skeleton width="xxl" height="text"></j-skeleton>
          ) : (
            meta.description || "No descriptioon"
          )}
        </div>
      </div>
      <j-button variant="primary">Join</j-button>
    </a>
  );
}
