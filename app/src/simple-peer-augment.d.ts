// Module augmentation — must be in a module file (has at least one import/export)
import 'simple-peer';

declare module 'simple-peer' {
  interface Instance {
    /** Internal data channel (accessed for readyState checks) */
    _channel: RTCDataChannel | null;
    /** Internal RTCPeerConnection (accessed for getSenders/replaceTrack) */
    _pc: RTCPeerConnection;
  }
}
