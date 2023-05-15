const deserialize = (string: string) => {
  return string.split("\n").map((line) => {
    return {
      children: [{ text: line }],
    };
  });
};

export default deserialize;
