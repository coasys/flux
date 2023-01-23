import { useEffect, useState } from "preact/hooks";
import getNeighbourhoodLink, {
  findNeighbourhood,
} from "utils/api/getNeighbourhoodLink";
import LinkCard from "./MessageCard";

import styles from "./index.scss";

export default function MessageCards({ message, perspectiveUuid, mainRef }) {
  const messageContent =
    message.editMessages[message.editMessages.length - 1].content;

  const [neighbourhoodCards, setNeighbourhoodCards] = useState<any[]>([]);

  useEffect(() => {
    getNeighbourhoodCards();
  }, [message.id, message.isNeighbourhoodCardHidden]);

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

  function onClick(url: string, type: string) {
    if (type === "link") {
      window.open(url, "_blank");
    } else {
      const event = new CustomEvent("neighbourhood-click", {
        detail: { url, channel: "Home" },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }

  return (
    <div class={styles.MessageCardsContentWrapper}>
      {neighbourhoodCards.map((e) => (
        <LinkCard
          isLoading={e.isLoading}
          name={e.name}
          description={e.description}
          image={e.image}
          showJoinButton={e.type !== "link"}
          onClick={() => onClick(e.url, e.type)}
        ></LinkCard>
      ))}
    </div>
  );
}
