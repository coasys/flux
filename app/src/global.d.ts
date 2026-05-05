// export {};

// declare global {
//   interface Window {
//     api: any;
//   }
// }

declare module 'howler';
declare module '*.wav';
declare module 'simple-peer/simplepeer.min.js' {
  import SimplePeer = require('simple-peer');
  export = SimplePeer;
}
