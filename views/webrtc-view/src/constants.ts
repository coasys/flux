const frameRate = {
  min: 5,
  ideal: 15,
  max: 30,
};

export const defaultSettings = {
  audio: true,
  screen: false,
  video: {
    width: {
      min: 640,
      ideal: 1920,
      max: 3840,
    },
    height: {
      min: 480,
      ideal: 1080,
      max: 2160,
    },
    aspectRatio: 1.777, // 16:9
    frameRate: frameRate,
  },
};
