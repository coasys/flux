class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => undefined;
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}

window.Worker = Worker;
