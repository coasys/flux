import { Settings } from "@fluxapp/utils";

const frameRate = {
  min: 5,
  ideal: 15,
  max: 30,
};

export const videoDimensions = {
  width: {
    min: 480,
    ideal: 1080,
    max: 2160,
  },
  height: {
    min: 480,
    ideal: 1080,
    max: 2160,
  },
  aspectRatio: 1, // 16:9
  frameRate: frameRate,
  deviceId: null,
};

export const defaultSettings = {
  audio: true,
  screen: false,
  video: videoDimensions,
} as Settings;
