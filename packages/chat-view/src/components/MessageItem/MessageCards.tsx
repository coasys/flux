import { useEffect, useState } from "preact/hooks";
import getNeighbourhoodLink, {
  findNeighbourhood,
} from "utils/api/getNeighbourhoodLink";
import NeighbourhoodCard from "./NeighbourhoodCard";
import LinkCard from "./LinkCard";

import styles from "./index.scss";

function Card({
  isLoading,
  type,
  image,
  url,
  mainRef,
  name,
  description,
  onClick,
  perspectiveUuid,
}) {
  function onNeighbourhoodClick(url: string) {
    const event = new CustomEvent("neighbourhood-click", {
      detail: { url },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  function onLinkClick(url: string) {
    window.open(url, "_blank");
  }

  if (type === "neighbourhood" || type === "neighbourhood-loading") {
    return (
      <NeighbourhoodCard
        isLoading={isLoading}
        onClick={() => onNeighbourhoodClick(url)}
        name={name}
        description={description}
        perspectiveUuid={perspectiveUuid}
      />
    );
  }

  if (type === "link") {
    return (
      <LinkCard
        isLoading={isLoading}
        onClick={() => onLinkClick(url)}
        name={name}
        description={description}
        image={image}
      />
    );
  }

  return null;
}

export default function MessageCards({ message, perspectiveUuid, mainRef }) {
  const messageContent =
    message.editMessages[message.editMessages.length - 1].content;

  const [neighbourhoodCards, setNeighbourhoodCards] = useState<any[]>([]);

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message.id, message.isNeighbourhoodCardHidden]);

  function onNeighbourhoodClick(url: string) {
    const event = new CustomEvent("neighbourhood-click", {
      detail: { url, channel: "Home" },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  const getNeighbourhoodCards = async () => {
    const [messageCards] = findNeighbourhood(messageContent);
    setNeighbourhoodCards(
      messageCards.map((m) => ({
        type: "neighbourhood-loading",
        name: "Neighbourhood link",
        description: "Join neighbourhood",
        url: m,
        isLoading: true,
      }))
    );

    try {
      const links = await getNeighbourhoodLink({
        perspectiveUuid,
        messageUrl: message.id,
        message: messageContent,
        isHidden: message.isNeighbourhoodCardHidden,
      });

      setNeighbourhoodCards(links);
    } catch (e) {
      setNeighbourhoodCards([]);
    }
  };

  return (
    <div class={styles.MessageCardsContentWrapper}>
      {neighbourhoodCards.map((e) => (
        <Card
          isLoading={e.isLoading}
          type={e.type}
          mainRef={mainRef}
          onClick={() => onNeighbourhoodClick(e.url)}
          name={e.name}
          description={e.description}
          perspectiveUuid={e.perspectiveUuid}
          url={e.url}
          image={e.image}
        ></Card>
      ))}
    </div>
  );
}
