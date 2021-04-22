import { AppSignal } from "@holochain/conductor-api";

/// This is the main function that receives and handles signals coming from the holochain conductor
/// In all instances this will be a link that has been comitting to some LinkLangage/Social-Context-DNA
/// The second value in signal param denotes the language hash this signal came from; this should be matched to
/// a appropriate perspective and then inserted into local database perspective for later quertying
export function handleAppSignalCallback(signal: [AppSignal, string]): void {
  console.log("Got signal inside communities app!", signal);
}
