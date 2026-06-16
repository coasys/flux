// Multi-session call helpers
//
// A single agent (DID) can now be in a call from several sessions at once —
// multiple browser tabs or multiple devices.  To make that work the unit of
// identity inside the call layer is a *session key* (`${did}::${sessionId}`)
// rather than a bare DID, so two sessions of the same person are tracked,
// connected and rendered independently.
//
// The functions here are pure so they can be unit-tested without Vue, Pinia,
// AD4M or real `MediaStream`s.

export type SessionMediaState = 'on' | 'off' | 'loading';
export type StreamKind = 'camera' | 'screenshare';

// The minimal slice of `MediaStream` the layout logic relies on.  Using an
// interface (rather than the DOM `MediaStream`) keeps these helpers testable
// in a plain Node/jsdom environment.
export interface StreamLike {
  getAudioTracks(): unknown[];
  getVideoTracks(): unknown[];
}

export interface RemoteCallSession<S extends StreamLike = StreamLike> {
  did: string;
  sessionId: string;
  streams: S[];
  streamReady: boolean;
  audioState: SessionMediaState;
  videoState: SessionMediaState;
  screenShareState: SessionMediaState;
}

export interface SessionTile<S extends StreamLike = StreamLike> {
  did: string;
  sessionId: string;
  streamKind: StreamKind;
  stream: S | undefined;
  streamReady: boolean;
  audioState: SessionMediaState;
  videoState: SessionMediaState;
  screenShareState: SessionMediaState;
  // Audio dedupe: at most one tile per person plays audio.  Every other tile
  // for that DID is muted so two devices don't echo each other.
  muteAudio: boolean;
}

const SESSION_KEY_SEPARATOR = '::';

/** Opaque, unique-per-session map key.  Never parse it — carry did/sessionId. */
export function sessionKey(did: string, sessionId: string): string {
  return `${did}${SESSION_KEY_SEPARATOR}${sessionId}`;
}

/**
 * Decide which side of a peering pair creates the initiating connection.
 * Comparing session keys (not DIDs) is essential: two sessions of the *same*
 * agent share a DID, so a DID comparison would tie and neither would initiate.
 */
export function shouldInitiate(mySessionKey: string, theirSessionKey: string): boolean {
  return mySessionKey.localeCompare(theirSessionKey) > 0;
}

/**
 * Collapse a list of session-level entries to one entry per DID — used for the
 * "one representation per person" UI (avatar groups, participant counts).  The
 * most recently updated session wins so the freshest profile/state is shown.
 */
export function dedupeByDid<T extends { did: string; lastUpdate?: number }>(items: T[]): T[] {
  const byDid = new Map<string, T>();
  for (const item of items) {
    const existing = byDid.get(item.did);
    if (!existing || (item.lastUpdate ?? 0) >= (existing.lastUpdate ?? 0)) byDid.set(item.did, item);
  }
  return Array.from(byDid.values());
}

// Split a session's streams into its (single) camera stream and any number of
// screenshare streams.  The camera stream is the one carrying audio (the mic);
// everything else with video is a screenshare.  Falls back to the first stream
// when no audio track is present (e.g. camera on, mic off).
function splitStreams<S extends StreamLike>(streams: S[]): { cameraStream: S | undefined; screenShareStreams: S[] } {
  const cameraStream = streams.find((s) => s.getAudioTracks().length > 0) ?? streams[0];
  const screenShareStreams = streams.filter((s) => s !== cameraStream && s.getVideoTracks().length > 0);
  return { cameraStream, screenShareStreams };
}

/**
 * Turn the remote call sessions into render tiles, implementing the agreed
 * model: **show every video / screenshare feed separately, but dedupe
 * non-video feeds so each person has a single representation and is heard
 * once.**
 *
 * Per DID:
 *  - Every session with camera video gets its own camera tile.
 *  - Every screenshare stream gets its own tile.
 *  - If the person has no video at all, they collapse to a single avatar tile.
 *  - Exactly one tile per person carries audio (the mic-on session, chosen
 *    deterministically); the rest are muted to avoid echo.
 *
 * Known limitation: if a person's only mic-on session has its camera off while
 * another of their sessions is showing video, an extra avatar tile is emitted
 * for the speaking session so their audio is never silently dropped.
 */
export function deriveRemoteSessionTiles<S extends StreamLike>(sessions: RemoteCallSession<S>[]): SessionTile<S>[] {
  // Group sessions by their owning DID.
  const groups = new Map<string, RemoteCallSession<S>[]>();
  for (const s of sessions) {
    const arr = groups.get(s.did) ?? [];
    arr.push(s);
    groups.set(s.did, arr);
  }

  const tiles: SessionTile<S>[] = [];

  for (const [did, group] of groups) {
    // Deterministic ordering by sessionId keeps tile order (and the audio
    // pick) stable across renders.
    const ordered = [...group].sort((a, b) => a.sessionId.localeCompare(b.sessionId));

    // The session that carries this person's audio: prefer a mic-on session,
    // tie-broken by sessionId; fall back to the first when nobody's mic is on.
    const primaryAudio = ordered.find((s) => s.audioState === 'on') ?? ordered[0];

    const groupTiles: SessionTile<S>[] = [];

    for (const s of ordered) {
      const { cameraStream, screenShareStreams } = splitStreams(s.streams);
      const hasCameraVideo = s.videoState === 'on' || s.videoState === 'loading';
      const hasScreenShare = screenShareStreams.length > 0;

      if (hasCameraVideo) {
        groupTiles.push({
          did,
          sessionId: s.sessionId,
          streamKind: 'camera',
          stream: cameraStream,
          streamReady: s.streamReady,
          audioState: s.audioState,
          videoState: s.videoState,
          // The camera tile never shows the screenshare badge — the
          // screenshare gets its own tile below.
          screenShareState: hasScreenShare ? 'off' : s.screenShareState,
          muteAudio: true, // resolved after the audio tile is chosen
        });
      }

      for (const screenStream of screenShareStreams) {
        groupTiles.push({
          did,
          sessionId: s.sessionId,
          streamKind: 'screenshare',
          stream: screenStream,
          streamReady: s.streamReady,
          audioState: 'off',
          videoState: 'off',
          screenShareState: 'on',
          muteAudio: true, // screenshare tiles never carry call audio
        });
      }
    }

    // No video anywhere → one avatar tile for the whole person, using the
    // primary-audio session's stream so a camera-off speaker is still heard.
    if (groupTiles.length === 0) {
      const { cameraStream } = splitStreams(primaryAudio.streams);
      groupTiles.push({
        did,
        sessionId: primaryAudio.sessionId,
        streamKind: 'camera',
        stream: cameraStream,
        streamReady: primaryAudio.streamReady,
        audioState: primaryAudio.audioState,
        videoState: 'off',
        screenShareState: 'off',
        muteAudio: true,
      });
    }

    // Make sure the speaking session always has a tile so its audio plays even
    // when its camera is off but another session is showing video.
    const primaryHasTile = groupTiles.some(
      (t) => t.sessionId === primaryAudio.sessionId && t.streamKind === 'camera',
    );
    if (!primaryHasTile && primaryAudio.audioState === 'on') {
      const { cameraStream } = splitStreams(primaryAudio.streams);
      groupTiles.push({
        did,
        sessionId: primaryAudio.sessionId,
        streamKind: 'camera',
        stream: cameraStream,
        streamReady: primaryAudio.streamReady,
        audioState: primaryAudio.audioState,
        videoState: 'off',
        screenShareState: 'off',
        muteAudio: true,
      });
    }

    // Unmute exactly one camera/avatar tile — the primary-audio session's.
    const cameraTiles = groupTiles.filter((t) => t.streamKind === 'camera');
    const audioTile = cameraTiles.find((t) => t.sessionId === primaryAudio.sessionId) ?? cameraTiles[0];
    if (audioTile) audioTile.muteAudio = false;

    tiles.push(...groupTiles);
  }

  return tiles;
}
