let peerConnection;

export function createPeerConnection(lasticecandidate) {
  const configuration = {
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org",
      },
    ],
  };
  try {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = handleicecandidate(lasticecandidate);
    peerConnection.onconnectionstatechange = handleconnectionstatechange;
    peerConnection.oniceconnectionstatechange = handleiceconnectionstatechange;
    return peerConnection;
  } catch (err) {
    console.log("error: " + err);
  }
}

function handleicecandidate(lasticecandidate) {
  return function (event) {
    if (event.candidate != null) {
      console.log("new ice candidate");
    } else {
      console.log("all ice candidates");
      lasticecandidate();
    }
  };
}

function handleconnectionstatechange(event) {
  console.log("handleconnectionstatechange");
  console.log(event);
}

function handleiceconnectionstatechange(event) {
  console.log("ice connection state: " + event.target.iceConnectionState);
}

function datachannelopen() {
  console.log("datachannelopen");
  console.log("connected");
}

function datachannelmessage(message) {
  console.log("datachannelmessage");
  console.log(message);
  const text = message.data;
  console.log(text);
}

// function chatbuttonclick() {
//   console.log("chatbuttonclick");
//   textelement = document.getElementById("chatinput");
//   text = textelement.value;
//   dataChannel.send(text);
//   console.log(text);
//   textelement.value = "";
// }

export function createOffer() {
  console.log("createOffer");

  peerConnection = createPeerConnection(lasticecandidate);

  const dataChannel = peerConnection.createDataChannel("chat");
  dataChannel.onopen = datachannelopen;
  dataChannel.onmessage = datachannelmessage;

  const createOfferPromise = peerConnection.createOffer();
  createOfferPromise.then(createOfferDone, createOfferFailed);

  function createOfferDone(offer) {
    console.log("createOfferDone");
    const setLocalPromise = peerConnection.setLocalDescription(offer);
    setLocalPromise.then(setLocalDone, setLocalFailed);
  }

  function createOfferFailed(reason) {
    console.log("createOfferFailed");
    console.log(reason);
  }
}

function setLocalDone() {
  console.log("setLocalDone");
}

function setLocalFailed(reason) {
  console.log("setLocalFailed");
  console.log(reason);
}

function lasticecandidate() {
  console.log("lasticecandidate", peerConnection.localDescription);

  return peerConnection.localDescription;
}

function clickoffersent() {
  console.log("clickoffersent");
}

function clickanswerpasted() {
  console.log("clickanswerpasted");

  // const answer = JSON.parse(textelement.value);
  // setRemotePromise = peerConnection.setRemoteDescription(answer);
  // setRemotePromise.then(setRemoteDone, setRemoteFailed);
}

function setRemoteDone() {
  console.log("setRemoteDone");
}

function setRemoteFailed(reason) {
  console.log("setRemoteFailed");
  console.log(reason);
}
