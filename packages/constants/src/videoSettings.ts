// Types for WebRTC settings that were previously imported from utils/helpers/WebRTCManager
export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface Settings {
  audio: boolean;
  video: boolean;
  screen: boolean;
  iceServers?: IceServer[];
  transcriber: {
    on: boolean;
    selectedModel: string;
    previewTimeout: number;
    messageTimeout: number;
  };
}

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
  video: false,
  screen: false,
  transcriber: {
    on: true,
    selectedModel: 'Base',
    previewTimeout: 0.4,
    messageTimeout: 5,
  },
} satisfies Settings;

export const defaultIceServers = [
  {
    urls: 'stun:relay.ad4m.dev:3478',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:relay.ad4m.dev:443',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'stun:global.stun.twilio.com:3478',
  },
] as IceServer[];
