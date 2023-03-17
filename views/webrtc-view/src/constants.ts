import { Settings } from "./WebRTCManager";

const frameRate = {
  min: 5,
  ideal: 15,
  max: 30,
};

export const videoDimensions = {
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
  deviceId: null,
};

export const defaultSettings = {
  audio: true,
  video: videoDimensions,
  screen: false,
} as Settings;
