import {
  deriveRemoteSessionTiles,
  dedupeByDid,
  sessionKey,
  shouldInitiate,
  type RemoteCallSession,
  type SessionMediaState,
  type StreamLike,
} from '../callSessions';

// A tiny fake stream: only the two methods the helper relies on.
function fakeStream(opts: { audio?: number; video?: number } = {}): StreamLike {
  const audio = new Array(opts.audio ?? 0).fill({});
  const video = new Array(opts.video ?? 0).fill({});
  return { getAudioTracks: () => audio, getVideoTracks: () => video };
}

function session(over: Partial<RemoteCallSession> & { did: string; sessionId: string }): RemoteCallSession {
  return {
    streams: [],
    streamReady: true,
    audioState: 'on' as SessionMediaState,
    videoState: 'off' as SessionMediaState,
    screenShareState: 'off' as SessionMediaState,
    ...over,
  };
}

describe('sessionKey', () => {
  it('combines did and sessionId into a stable key', () => {
    expect(sessionKey('did:key:alice', 'tab-1')).toBe('did:key:alice::tab-1');
  });
});

describe('shouldInitiate', () => {
  it('exactly one side of a pair initiates', () => {
    const a = sessionKey('did:key:alice', 's1');
    const b = sessionKey('did:key:bob', 's2');
    expect(shouldInitiate(a, b)).not.toBe(shouldInitiate(b, a));
  });

  it('breaks ties between two sessions of the SAME did (would deadlock on did alone)', () => {
    const a = sessionKey('did:key:alice', 's1');
    const b = sessionKey('did:key:alice', 's2');
    expect(a).not.toBe(b);
    expect(shouldInitiate(a, b)).not.toBe(shouldInitiate(b, a));
  });
});

describe('dedupeByDid', () => {
  it('keeps one entry per did, preferring the most recently updated', () => {
    const items = [
      { did: 'a', sessionId: 's1', lastUpdate: 1 },
      { did: 'a', sessionId: 's2', lastUpdate: 5 },
      { did: 'b', sessionId: 's3', lastUpdate: 2 },
    ];
    const result = dedupeByDid(items);
    expect(result).toHaveLength(2);
    expect(result.find((i) => i.did === 'a')?.sessionId).toBe('s2');
    expect(result.find((i) => i.did === 'b')?.sessionId).toBe('s3');
  });
});

describe('deriveRemoteSessionTiles', () => {
  it('renders a single camera tile for a normal session and plays its audio', () => {
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's1', videoState: 'on', audioState: 'on', streams: [fakeStream({ audio: 1, video: 1 })] }),
    ]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ did: 'a', sessionId: 's1', streamKind: 'camera', muteAudio: false });
  });

  it('splits a camera + screenshare session into two tiles, muting the screenshare', () => {
    const camera = fakeStream({ audio: 1, video: 1 });
    const screen = fakeStream({ video: 1 });
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's1', videoState: 'on', audioState: 'on', streams: [camera, screen] }),
    ]);
    expect(tiles).toHaveLength(2);
    const cam = tiles.find((t) => t.streamKind === 'camera')!;
    const share = tiles.find((t) => t.streamKind === 'screenshare')!;
    expect(cam.muteAudio).toBe(false);
    expect(share.muteAudio).toBe(true);
    expect(share.stream).toBe(screen);
  });

  it('shows each session of one person as its own video tile but plays audio from only one', () => {
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's2', videoState: 'on', audioState: 'on', streams: [fakeStream({ audio: 1, video: 1 })] }),
      session({ did: 'a', sessionId: 's1', videoState: 'on', audioState: 'on', streams: [fakeStream({ audio: 1, video: 1 })] }),
    ]);
    const cameraTiles = tiles.filter((t) => t.streamKind === 'camera');
    expect(cameraTiles).toHaveLength(2);
    // exactly one tile carries audio (no echo)
    expect(cameraTiles.filter((t) => !t.muteAudio)).toHaveLength(1);
    // deterministic: the lowest sessionId is the audio tile
    expect(cameraTiles.find((t) => !t.muteAudio)?.sessionId).toBe('s1');
  });

  it('collapses a person with no video at all into a single avatar tile', () => {
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's1', videoState: 'off', audioState: 'on', streams: [fakeStream({ audio: 1 })] }),
      session({ did: 'a', sessionId: 's2', videoState: 'off', audioState: 'off', streams: [] }),
    ]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ did: 'a', streamKind: 'camera', muteAudio: false });
  });

  it('keeps the speaking session audible even when another session shows the video', () => {
    // s1: camera on but mic off; s2: camera off but mic on (the speaker)
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's1', videoState: 'on', audioState: 'off', streams: [fakeStream({ audio: 1, video: 1 })] }),
      session({ did: 'a', sessionId: 's2', videoState: 'off', audioState: 'on', streams: [fakeStream({ audio: 1 })] }),
    ]);
    const unmuted = tiles.filter((t) => !t.muteAudio);
    expect(unmuted).toHaveLength(1);
    expect(unmuted[0].sessionId).toBe('s2'); // the mic-on session is the one heard
  });

  it('treats different people independently', () => {
    const tiles = deriveRemoteSessionTiles([
      session({ did: 'a', sessionId: 's1', videoState: 'on', audioState: 'on', streams: [fakeStream({ audio: 1, video: 1 })] }),
      session({ did: 'b', sessionId: 's2', videoState: 'on', audioState: 'on', streams: [fakeStream({ audio: 1, video: 1 })] }),
    ]);
    expect(tiles.map((t) => t.did).sort()).toEqual(['a', 'b']);
    expect(tiles.every((t) => !t.muteAudio)).toBe(true);
  });
});
