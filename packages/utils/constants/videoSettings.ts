import { Settings } from "utils/helpers/WebRTCManager";

const frameRate = {
  min: 5,
  ideal: 15,
  max: 20,
};

export const videoDimensions = {
  width: {
    min: 640,
    ideal: 1280,
    max: 1920,
  },
  height: {
    min: 360,
    ideal: 720,
    max: 1080,
  },
  aspectRatio: 1.777, // 16:9
  frameRate: frameRate,
  deviceId: undefined,
};

export const defaultSettings = {
  audio: true,
  video: videoDimensions,
  screen: false,
} as Settings;
