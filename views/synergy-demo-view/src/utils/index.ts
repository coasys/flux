// todo: change to singular transformItem?
export function transformItems(type, items) {
  // map message, post, & task expressions into consistent format
  return items.map((item) => {
    const newItem = {
      type,
      id: item.id,
      author: item.author,
      timestamp: item.timestamp,
      text: "",
      icon: "question",
    };
    if (type === "Message") {
      newItem.text = item.body;
      newItem.icon = "chat";
    } else if (type === "Post") {
      newItem.text = item.body;
      newItem.icon = "postcard";
    } else if (type === "Task") {
      newItem.text = item.name;
      newItem.icon = "kanban";
    }
    return newItem;
  });
}
