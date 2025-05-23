import {
  getDefaultIceServers,
  getForVersion,
  setForVersion,
  throttle,
} from "@coasys/flux-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { version } from "../package.json";

import {
  Connection,
  Event,
  EventLogItem,
  IceServer,
  Settings,
  WebRTCManager,
} from "@coasys/flux-webrtc";

import { Agent, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { videoSettings } from "@coasys/flux-constants";

const { defaultSettings, videoDimensions } = videoSettings;

export type Peer = {
  did: string;
  connection: Connection;
  state: {
    settings: Settings;
    [key: string]: any;
  };
};

export type Reaction = {
  did: string;
  reaction: string;
};

type Props = {
  enabled: boolean;
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  defaultState?: Peer["state"];
  events?: {
    onPeerJoin?: (uuid: string) => void;
    onPeerLeave?: (uuid: string) => void;
  };
};

type JoinProps = {
  initialState?: Peer["state"];
};

export type WebRTC = {
  localStream: MediaStream | null;
  localState: Peer["state"];
  connections: Peer[];
  devices: MediaDeviceInfo[];
  iceServers: IceServer[];
  reactions: Reaction[];
  localEventLog: EventLogItem[];
  isInitialised: boolean;
  hasJoined: boolean;
  isLoading: boolean;
  audioPermissionGranted: boolean;
  videoPermissionGranted: boolean;
  onJoin: (props: JoinProps) => Promise<void>;
  onLeave: () => Promise<void>;
  onReaction: (reaction: string) => Promise<void>;
  onToggleCamera: (enabled: boolean) => void;
  onChangeCamera: (deviceId: string) => void;
  onToggleAudio: (enabled: boolean) => void;
  onChangeAudio: (deviceId: string) => void;
  onToggleScreenShare: (enabled: boolean) => void;
  onChangeState: (newState: Peer["state"]) => void;
  onChangeIceServers: (servers: IceServer[]) => void;
  updateTranscriptionSetting: (setting: string, value: any) => void;
};

export default function useWebRTC({
  enabled,
  source,
  perspective,
  agent: agentClient,
  events,
}: Props): WebRTC {
  const defaultState = { settings: defaultSettings };

  const manager = useRef<WebRTCManager | null>();
  const [localState, setLocalState] = useState<Peer["state"]>(defaultState);
  const localStateRef = useRef<Peer["state"]>(defaultState);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [videoPermissionGranted, setVideoPermissionGranted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [agent, setAgent] = useState<Agent>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const [iceServers, setIceServers] = useState<IceServer[]>(
    getDefaultIceServers()
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Peer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [localEventLog, setLocalEventLog] = useState<EventLogItem[]>([]);

  // Leave on unmount
  useEffect(() => {
    return () => {
      onLeave();
    };
  }, []);

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await agentClient.me();
      setAgent(agent);
    }

    if (!agent) {
      fetchAgent();
    }
  }, [agent]);

  /**
   * getDevices - Enumerate user devices
   *
   * 1: Run this on mount to determine if user has any video devices,
   * NB: This will only return the 'devicetype', not labels or id's.
   * 2: Run again AFTER permission has been granted as we need the
   * names of the devices for the "device selector" modal.
   */
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('devices: ', devices)
        setDevices(devices);
        devicesRef.current = devices;
      } catch (e) {}
    }

    getDevices();
  }, [audioPermissionGranted, videoPermissionGranted]);

  /**
   * askForPermission - Ask for user permission to access audio/video
   *
   * 1: Check if user has videodevices, if not, set video: false to
   * prevent crash.
   * 2: Check if user has previously selected audio/video device, if so
   * use this device when creating stream.
   */
  useEffect(() => {
    async function askForPermission() {
      const joinSettings = { ...localStateRef.current.settings };

      // Check if the user has no video devices
      const hasVideoDevices = devices.some((d) => d.kind === "videoinput");
      if (!hasVideoDevices) {
        joinSettings.video = false;
      }

      // Check if access has already been given
      const allowedAudioDevices = devices.some(
        (d) => d.kind === "audioinput" && d.label !== ""
      );
      const allowedVideoDevices = devices.some(
        (d) => d.kind === "videoinput" && d.label !== ""
      );

      if (allowedAudioDevices || allowedVideoDevices) {
        setAudioPermissionGranted(allowedAudioDevices);
        setVideoPermissionGranted(allowedVideoDevices);
        return;
      }

      navigator.mediaDevices?.getUserMedia(joinSettings).then(
        () => {
          setAudioPermissionGranted(true);
        },
        (e) => {
          console.error(e);
          setAudioPermissionGranted(false);
        }
      );
    }

    if (enabled && !audioPermissionGranted && devices.length > 0) {
      askForPermission();
    }
  }, [enabled, localState, audioPermissionGranted, devices]);

  /**
   * TogglePreRecording
   *
   * Stop recording user input if user hasn't joined yet and goes to another view
   */
  // useEffect(() => {
  //   async function TogglePreRecording() {
  //     // Return if permission denied
  //     if (!videoPermissionGranted) {
  //       return;
  //     }

  //     if (enabled && !showPreview) {
  //       const newLocalStream = await navigator.mediaDevices.getUserMedia({
  //         audio: localStateRef.current.settings.audio,
  //         video: localStateRef.current.settings.video,
  //       });
  //       setLocalStream(newLocalStream);
  //       localStreamRef.current = newLocalStream;
  //       setShowPreview(true);
  //     }

  //     if (!enabled && showPreview && localStreamRef.current) {
  //       localStreamRef.current.getTracks().forEach((track) => track.stop());
  //       setShowPreview(false);
  //     }
  //   }
  //   if (!hasJoined) {
  //     TogglePreRecording();
  //   }
  // }, [enabled, showPreview, videoPermissionGranted, hasJoined, localState]);

  /**
   * Attach signal listeners
   */
  useEffect(() => {
    if (source && perspective.uuid && agent && !isInitialised) {
      manager.current = new WebRTCManager({
        source,
        perspective,
        agent: agentClient,
      });

      manager.current.on(
        Event.PEER_ADDED,
        (did, connection: Peer["connection"]) => {
          setConnections((oldConnections) => [
            ...oldConnections,
            { did, connection, state: defaultState },
          ]);
        }
      );

      manager.current.on(Event.PEER_REMOVED, (did) => {
        setConnections((oldConnections) => {
          return oldConnections.filter((c) => c.did !== did);
        });

        events?.onPeerLeave && events.onPeerLeave(did);
      });

      manager.current.on(Event.CONNECTION_ESTABLISHED, (did) => {
        setIsLoading(false);
        events?.onPeerJoin && events.onPeerJoin(did);
        manager.current?.sendMessage("request-state", did);
      });

      manager.current.on(Event.EVENT, (did, event) => {
        setLocalEventLog((oldEvents) => [...oldEvents, event]);
      });

      manager.current.on(
        Event.MESSAGE,
        (senderDid: string, type: string, message: any) => {
          if (type === "reaction") {
            setReactions([...reactions, { did: senderDid, reaction: message }]);
          }

          if (type === "request-state" && senderDid !== agent.did) {
            setLocalState((oldState) => {
              manager.current?.sendMessage("state", oldState);
              return oldState;
            });
          }

          if (type === "state" && senderDid !== agent.did) {
            setConnections((oldConnections) => {
              const match = oldConnections.find((c) => c.did === senderDid);
              if (!match) {
                return oldConnections;
              }

              const newPeer = {
                ...match,
                state: message,
              };

              return [
                ...oldConnections.filter((c) => c.did !== senderDid),
                newPeer,
              ];
            });
          }

          if (type === "tracks-changed" && senderDid !== agent.did) {
            console.log('*** tracks changed from peer:', senderDid)
            // Request updated state first
            manager.current?.sendMessage("request-state", senderDid);
          }
        }
      );

      setIsInitialised(true);

      return () => {
        if (hasJoined) {
          manager.current?.leave().then(() => {
            manager.current = null;
          });
        }
      };
    }
  }, [source, perspective.uuid, isInitialised, hasJoined, agent, localState]);

  /**
   * Handle reactions
   */
  async function onReaction(reaction: string) {
    await manager.current?.sendMessage("reaction", reaction);
  }

  /**
   * Change video input source
   */
  async function onChangeCamera(deviceId: string) {
    const newSettings = {
      ...localStateRef.current.settings,
      video: { ...videoDimensions, deviceId: deviceId },
    };

    const newLocalStream =
      await navigator.mediaDevices.getUserMedia(newSettings);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      updateStream(newLocalStream);

      // Notify others of state change
      onChangeState({ ...localStateRef.current, settings: newSettings });
    } else {
      setLocalStream(newLocalStream);
      localStreamRef.current = newLocalStream;
    }

    // Persist settings
    setForVersion(version, "cameraDeviceId", `${deviceId}`);
  }

  /**
   * Change audio input source
   */
  async function onChangeAudio(deviceId: string) {
    const newSettings = {
      ...localStateRef.current.settings,
      audio: { deviceId: deviceId },
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      const newLocalStream =
        await navigator.mediaDevices.getUserMedia(newSettings);
      updateStream(newLocalStream);
    }

    // Persist settings
    setForVersion(version, "audioDeviceId", `${deviceId}`);

    // Notify others of state change
    onChangeState({ ...localStateRef.current, settings: newSettings });
  }

  /**
   * Enable/disable video input
   */
  // async function onToggleCamera(enabled: boolean) {    
  //   // Update settings
  //   const videoDeviceIdFromLocalStorage = getForVersion(version, "cameraDeviceId");
  //   const newSettings = {
  //     ...localStateRef.current.settings,
  //     video: enabled
  //       ? {
  //           ...videoDimensions,
  //           deviceId: videoDeviceIdFromLocalStorage || undefined,
  //         }
  //       : false,
  //   };
    
  //   // If we already have a stream with video tracks, just toggle them
  //   if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
  //     localStreamRef.current.getVideoTracks().forEach(track => {
  //       track.enabled = enabled;
  //     });
  //   } 
  //   // If we're enabling video but don't have video tracks, we need to get them
  //   else if (enabled && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
  //     try {
  //       const audioEnabled = localStreamRef.current?.getAudioTracks().some(track => track.enabled) || false;
  //       const audioConstraints = audioEnabled ? localStateRef.current.settings.audio : false;

  //       const newLocalStream = await navigator.mediaDevices.getUserMedia({
  //         audio: audioConstraints,
  //         video: newSettings.video,
  //       });
        
  //       if (!localStreamRef.current) {
  //         setLocalStream(newLocalStream);
  //         localStreamRef.current = newLocalStream;
  //       } else {
  //         updateStream(newLocalStream);
  //       }
  //     } catch (error) {
  //       console.error("Error getting video stream:", error);
  //     }
  //   }
  
  //   // Handle video permissions
  //   if (enabled && !videoPermissionGranted) {
  //     setVideoPermissionGranted(true);
  //   }
  
  //   // Notify others of state change
  //   onChangeState({ ...localStateRef.current, settings: newSettings });
  // }

  async function onToggleCamera(enabled: boolean) {    
    // Update settings
    const videoDeviceIdFromLocalStorage = getForVersion(version, "cameraDeviceId");
    const newSettings = {
      ...localStateRef.current.settings,
      video: enabled
        ? {
            ...videoDimensions,
            deviceId: videoDeviceIdFromLocalStorage || undefined,
          }
        : false,
    };
    
    // If we already have a stream with video tracks, just toggle them
    if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    } 
    // If we're enabling video but don't have video tracks, we need to get them
    else if (enabled && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
      try {
        // Request ONLY video tracks - don't touch audio
        const newVideoOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: false, // Don't request audio at all
          video: newSettings.video,
        });
        
        if (!localStreamRef.current) {
          // If no existing stream, use this one directly
          setLocalStream(newVideoOnlyStream);
          localStreamRef.current = newVideoOnlyStream;
        } else {
          // If we have an existing stream, only update the video portion
          updateStream(newVideoOnlyStream, { handleVideo: true, handleAudio: false });
        }
      } catch (error) {
        console.error("Error getting video stream:", error);
      }
    }
  
    // Handle video permissions
    if (enabled && !videoPermissionGranted) {
      setVideoPermissionGranted(true);
    }
  
    // Notify others of state change
    onChangeState({ ...localStateRef.current, settings: newSettings });
  }

  /**
   * Enable/disable audio input
   */
  // async function onToggleAudio(enabled: boolean) {    
  //   // Update settings
  //   const newSettings = {
  //     ...localStateRef.current.settings,
  //     audio: enabled
  //       ? (localStateRef.current.settings.audio || { deviceId: getForVersion(version, "audioDeviceId") })
  //       : false,
  //   };
    
  //   // If we already have a stream with audio tracks, just toggle them
  //   if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
  //     localStreamRef.current.getAudioTracks().forEach(track => {
  //       track.enabled = enabled;
  //     });
  //   } 
  //   // If we're enabling audio but don't have audio tracks, we need to get them
  //   else if (enabled && (!localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0)) {
  //     // Check if video is currently enabled to include in constraints
  //     const videoEnabled = localStreamRef.current?.getVideoTracks().some(track => track.enabled) || false;
  //     const videoConstraints = videoEnabled ? localStateRef.current.settings.video : false;
  
  //     try {
  //       const newLocalStream = await navigator.mediaDevices.getUserMedia({
  //         audio: newSettings.audio,
  //         video: videoConstraints,
  //       });
        
  //       if (!localStreamRef.current) {
  //         setLocalStream(newLocalStream);
  //         localStreamRef.current = newLocalStream;
  //       } else {
  //         updateStream(newLocalStream);
  //       }
  //     } catch (error) {
  //       console.error("Error getting audio stream:", error);
  //     }
  //   }
  
  //   // Notify others of state change
  //   onChangeState({ ...localStateRef.current, settings: newSettings });
  // }

  async function onToggleAudio(enabled: boolean) {    
    // Update settings
    const newSettings = {
      ...localStateRef.current.settings,
      audio: enabled
        ? (localStateRef.current.settings.audio || { deviceId: getForVersion(version, "audioDeviceId") })
        : false,
    };
    
    // If we already have a stream with audio tracks, just toggle them
    if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    } 
    // If we're enabling audio but don't have audio tracks, we need to get them
    else if (enabled && (!localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0)) {
      try {
        // Request ONLY audio tracks - don't touch video
        const newAudioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: newSettings.audio,
          video: false, // Don't request video at all
        });
        
        if (!localStreamRef.current) {
          // If no existing stream, use this one directly
          setLocalStream(newAudioOnlyStream);
          localStreamRef.current = newAudioOnlyStream;
        } else {
          // If we have an existing stream, only update the audio portion
          updateStream(newAudioOnlyStream, { handleVideo: false, handleAudio: true });
        }
      } catch (error) {
        console.error("Error getting audio stream:", error);
      }
    }
  
    // Notify others of state change
    onChangeState({ ...localStateRef.current, settings: newSettings });
  }

  /**
   * Update transcription setting
   */
  async function updateTranscriptionSetting(setting: string, value: any) {
    const newSettings = {
      ...localStateRef.current.settings,
      transcriber: { ...localStateRef.current.settings.transcriber, [setting]: value },
    };
    // Notify others of state change when toggling 'on' setting
    if (setting === "on")
      onChangeState({ ...localStateRef.current, settings: newSettings });
    // Otherwise just update local state
    else setLocalState({ ...localStateRef.current, settings: newSettings });
  }

  /**
   * Enable/disable screen share
   */
  async function onToggleScreenShare(enabled: boolean) {
    const newSettings = {
      ...localStateRef.current.settings,
      screen: enabled,
    };

    if (enabled) {
      await onStartScreenShare();
    } else {
      await onEndScreenShare();
    }

    // Notify others of state change
    onChangeState({ ...localStateRef.current, settings: newSettings });
  }

  /**
   * Start screenshare
   */
  async function onStartScreenShare() {
    if (localStreamRef.current) {
      let mediaStream;

      if (navigator.mediaDevices.getDisplayMedia) {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      mediaStream.getVideoTracks()[0].onended = () =>
        onToggleScreenShare(false);
      updateStream(mediaStream);
    }
  }

  async function onEndScreenShare() {
    const newLocalStream = await navigator.mediaDevices.getUserMedia({
      audio: localStateRef.current.settings.audio,
      video: localStateRef.current.settings.video,
    });

    // Ensure screen sharing has stopped
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    updateStream(newLocalStream);
  }

  // function updateStream(stream: MediaStream) {
  //   const [videoTrack] = stream.getVideoTracks();
  //   const [audioTrack] = stream.getAudioTracks();

  //   // Update all peers (Important, as peer expects the same stream)
  //   // -> https://github.com/feross/simple-peer/issues/634#issuecomment-621761586
  //   for (let peer of connections) {
  //     if (videoTrack) {
  //       const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

  //       if (oldVideoTrack) {
  //         peer.connection.peer.replaceTrack(
  //           oldVideoTrack,
  //           videoTrack,
  //           localStreamRef.current
  //         );
  //       } else {
  //         peer.connection.peer.addTrack(videoTrack, localStreamRef.current);
  //       }
  //     }

  //     if (audioTrack) {
  //       const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];

  //       if (oldAudioTrack) {
  //         peer.connection.peer.replaceTrack(
  //           localStreamRef.current.getAudioTracks()[0],
  //           audioTrack,
  //           localStreamRef.current
  //         );
  //       } else {
  //         peer.connection.peer.addTrack(audioTrack, localStreamRef.current);
  //       }
  //     }
  //   }

  //   // Update local state
  //   if (videoTrack) {
  //     const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
  //     if (oldVideoTrack) {
  //       localStreamRef.current?.removeTrack(oldVideoTrack);
  //       localStreamRef.current?.addTrack(videoTrack);
  //     } else {
  //       localStreamRef.current?.addTrack(videoTrack);
  //     }
  //   }

  //   if (audioTrack) {
  //     const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
  //     if (oldAudioTrack) {
  //       localStreamRef.current?.removeTrack(oldAudioTrack);
  //       localStreamRef.current?.addTrack(audioTrack);
  //     } else {
  //       localStreamRef.current?.addTrack(audioTrack);
  //     }
  //   }
  // }

  // async function updateStream(stream: MediaStream) {
  //   console.log("Update stream called with:", 
  //     stream.getVideoTracks().length ? "video track" : "no video", 
  //     stream.getAudioTracks().length ? "audio track" : "no audio");
  
  //   // If no local stream exists yet, just use the new stream directly
  //   if (!localStreamRef.current) {
  //     console.log("No existing stream, using new stream directly");
  //     setLocalStream(stream);
  //     localStreamRef.current = stream;
  //     return;
  //   }
  
  //   // Get new tracks
  //   const videoTrack = stream.getVideoTracks()[0];
  //   const audioTrack = stream.getAudioTracks()[0];
    
  //   // Get existing tracks
  //   const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
  //   const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
    
  //   console.log("Existing tracks:", 
  //     oldVideoTrack ? "has video" : "no video", 
  //     oldAudioTrack ? "has audio" : "no audio");
  
  //   try {
  //     // Always update the local stream first to ensure media displays correctly
  //     // This is critical - update local media display before peer connections
      
  //     // Handle video track
  //     if (videoTrack) {
  //       if (oldVideoTrack) {
  //         console.log("Removing old video track from local stream");
  //         localStreamRef.current.removeTrack(oldVideoTrack);
  //       }
  //       console.log("Adding new video track to local stream");
  //       localStreamRef.current.addTrack(videoTrack);
  //     }
      
  //     // Handle audio track
  //     if (audioTrack) {
  //       if (oldAudioTrack) {
  //         console.log("Removing old audio track from local stream");
  //         localStreamRef.current.removeTrack(oldAudioTrack);
  //       }
  //       console.log("Adding new audio track to local stream");
  //       localStreamRef.current.addTrack(audioTrack);
  //     }
  
  //     // Now update all peer connections
  //     for (let peer of connections) {
  //       try {
  //         console.log("Updating tracks for peer:", peer.did);
  //         // Track changes that need signaling
  //         let trackChanges = false;
          
  //         // Update video
  //         if (videoTrack) {
  //           trackChanges = true;
  //           if (oldVideoTrack) {
  //             try {
  //               console.log('Replacing old video track for peer')
  //               await peer.connection.peer.replaceTrack(
  //                 oldVideoTrack,
  //                 videoTrack,
  //                 localStreamRef.current
  //               );
  //             } catch (err) {
  //               console.error("Failed to replace old video track, trying to renegotiate", err);
  //               peer.connection.peer.addTrack(videoTrack, localStreamRef.current);
  //             }
  //           } else {
  //             console.log('Adding new video track to peer')
  //             peer.connection.peer.addTrack(videoTrack, localStreamRef.current);
  //           }
  //         }
          
  //         // Update audio
  //         if (audioTrack) {
  //           trackChanges = true;
  //           if (oldAudioTrack) {
  //             try {
  //               console.log("Replacing old audio track for peer");
  //               await peer.connection.peer.replaceTrack(
  //                 oldAudioTrack,
  //                 audioTrack,
  //                 localStreamRef.current
  //               );
  //             } catch (err) {
  //               console.error("Failed to replace audio track, trying to renegotiate", err);
  //               peer.connection.peer.addTrack(audioTrack, localStreamRef.current);
  //             }
  //           } else {
  //             console.log("Adding new audio track to peer");
  //             peer.connection.peer.addTrack(audioTrack, localStreamRef.current);
  //           }
  //         }

  //         // If tracks changed significantly, trigger renegotiation
  //         if (trackChanges) {
  //           // Signal to the peer that we've changed tracks
  //           manager.current?.sendMessage("tracks-changed", peer.did);
  //         }
  //       } catch (err) {
  //         console.error("Error updating tracks for peer:", peer.did, err);
  //       }
  //     }
      
  //     // After successfully updating, stop old tracks to free resources
  //     if (oldVideoTrack && videoTrack) {
  //       console.log("Stopping old video track");
  //       oldVideoTrack.stop();
  //     }
      
  //     if (oldAudioTrack && audioTrack) {
  //       console.log("Stopping old audio track");
  //       oldAudioTrack.stop();
  //     }
      
  //     // Clean up any unused tracks from the source stream
  //     if (stream !== localStreamRef.current) {
  //       console.log("Cleaning up original stream");
  //       stream.getTracks().forEach(track => {
  //         const isVideoAdded = track.kind === 'video' && localStreamRef.current.getVideoTracks().includes(track);
  //         const isAudioAdded = track.kind === 'audio' && localStreamRef.current.getAudioTracks().includes(track);
          
  //         if (!isVideoAdded && !isAudioAdded) {
  //           console.log(`Stopping unused ${track.kind} track from original stream`);
  //           track.stop();
  //         }
  //       });
  //     }
      
  //     // Force UI update by setting the stream state
  //     setLocalStream(localStreamRef.current);
      
  //   } catch (err) {
  //     console.error("Error in updateStream:", err);
  //   }
  // }

  async function updateStream(stream: MediaStream, options = { handleVideo: true, handleAudio: true }) {
    console.log("Update stream called with:", 
      stream.getVideoTracks().length ? "video track" : "no video", 
      stream.getAudioTracks().length ? "audio track" : "no audio",
      "options:", options);
    
    // If no local stream exists yet, just use the new stream directly
    if (!localStreamRef.current) {
      console.log("No existing stream, using new stream directly");
      setLocalStream(stream);
      localStreamRef.current = stream;
      return;
    }
    
    // Get new tracks
    const videoTrack = options.handleVideo ? stream.getVideoTracks()[0] : null;
    const audioTrack = options.handleAudio ? stream.getAudioTracks()[0] : null;
    
    // Get existing tracks
    const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
    const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
    
    console.log("Existing tracks:", 
      oldVideoTrack ? "has video" : "no video", 
      oldAudioTrack ? "has audio" : "no audio");
    
    try {
      // Always update the local stream first to ensure media displays correctly
      
      // Handle video track if needed
      if (videoTrack && options.handleVideo) {
        if (oldVideoTrack) {
          console.log("Removing old video track from local stream");
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        console.log("Adding new video track to local stream");
        localStreamRef.current.addTrack(videoTrack);
      }
      
      // Handle audio track if needed
      if (audioTrack && options.handleAudio) {
        if (oldAudioTrack) {
          console.log("Removing old audio track from local stream");
          localStreamRef.current.removeTrack(oldAudioTrack);
        }
        console.log("Adding new audio track to local stream");
        localStreamRef.current.addTrack(audioTrack);
      }
      
      // Now update all peer connections
      for (let peer of connections) {
        try {
          console.log("Updating tracks for peer:", peer.did);
          // Track changes that need signaling
          let trackChanges = false;
          
          // Update video if needed
          if (videoTrack && options.handleVideo) {
            trackChanges = true;
            if (oldVideoTrack) {
              try {
                console.log('Replacing old video track for peer')
                await peer.connection.peer.replaceTrack(
                  oldVideoTrack,
                  videoTrack,
                  localStreamRef.current
                );
              } catch (err) {
                console.error("Failed to replace old video track, trying to renegotiate", err);
                peer.connection.peer.addTrack(videoTrack, localStreamRef.current);
              }
            } else {
              console.log('Adding new video track to peer')
              peer.connection.peer.addTrack(videoTrack, localStreamRef.current);
            }
          }
          
          // Update audio if needed
          if (audioTrack && options.handleAudio) {
            trackChanges = true;
            if (oldAudioTrack) {
              try {
                console.log("Replacing old audio track for peer");
                await peer.connection.peer.replaceTrack(
                  oldAudioTrack,
                  audioTrack,
                  localStreamRef.current
                );
              } catch (err) {
                console.error("Failed to replace audio track, trying to renegotiate", err);
                peer.connection.peer.addTrack(audioTrack, localStreamRef.current);
              }
            } else {
              console.log("Adding new audio track to peer");
              peer.connection.peer.addTrack(audioTrack, localStreamRef.current);
            }
          }
  
          // If tracks changed significantly, trigger renegotiation
          if (trackChanges) {
            // Signal to the peer that we've changed tracks
            manager.current?.sendMessage("tracks-changed", peer.did);
          }
        } catch (err) {
          console.error("Error updating tracks for peer:", peer.did, err);
        }
      }
      
      // After successfully updating, stop old tracks to free resources
      if (oldVideoTrack && videoTrack && options.handleVideo) {
        console.log("Stopping old video track");
        oldVideoTrack.stop();
      }
      
      if (oldAudioTrack && audioTrack && options.handleAudio) {
        console.log("Stopping old audio track");
        oldAudioTrack.stop();
      }
      
      // Clean up any unused tracks from the source stream
      if (stream !== localStreamRef.current) {
        console.log("Cleaning up original stream");
        stream.getTracks().forEach(track => {
          const isVideoAdded = track.kind === 'video' && videoTrack === track;
          const isAudioAdded = track.kind === 'audio' && audioTrack === track;
          
          if (!isVideoAdded && !isAudioAdded) {
            console.log(`Stopping unused ${track.kind} track from original stream`);
            track.stop();
          }
        });
      }
      
      // Force UI update by setting the stream state
      setLocalStream(localStreamRef.current);
      
    } catch (err) {
      console.error("Error in updateStream:", err);
    }
  }

  const broadcastStateChange = (newState: Peer["state"]) => {
    manager.current?.sendMessage("state", newState);
  };

  const throttledStateBroadcast = useCallback(
    throttle(broadcastStateChange, 100),
    []
  );

  function onChangeState(newState: Peer["state"]) {
    setLocalState(newState);
    localStateRef.current = newState;
    throttledStateBroadcast(newState);
  }

  function onChangeIceServers(newServers: IceServer[]) {
    setIceServers(newServers);
    setForVersion(version, "iceServers", JSON.stringify(newServers));
    manager.current.iceServers = newServers;
  }

  async function onJoin({ initialState }) {
    setIsLoading(true);

    const joinSettings = { ...localStateRef.current.settings };

    // Check if the user has no video devices
    const hasVideoDevices = devicesRef.current.some((d) => d.kind === "videoinput");
    if (!hasVideoDevices) joinSettings.video = false;

    // Set local state
    setLocalState({ ...initialState, settings: joinSettings });

    if (manager.current) {
      const stream = await manager.current.join(joinSettings);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setHasJoined(true);
    } else {
      console.log("Error: No WebRTCManager instance when trying to join!");
    }
  }

  async function onLeave() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        localStreamRef.current.removeTrack(track);
      });
    }
    await manager.current?.leave();
    setConnections([]);
    setReactions([]);
    setLocalStream(null);
    localStreamRef.current = null;
    setIsLoading(false);
    setHasJoined(false);
    setShowPreview(false);
  }

  return {
    localStream,
    localState,
    localEventLog,
    connections,
    devices,
    iceServers,
    reactions,
    isInitialised,
    hasJoined,
    isLoading,
    audioPermissionGranted,
    videoPermissionGranted,
    onJoin,
    onLeave,
    onReaction,
    onToggleCamera,
    onChangeCamera,
    onToggleAudio,
    onChangeAudio,
    onToggleScreenShare,
    onChangeState,
    onChangeIceServers,
    updateTranscriptionSetting,
  };
}
