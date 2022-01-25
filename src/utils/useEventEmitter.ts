import { ref } from "vue";

const PERSPECTIVE_VIEW_EVENT_ELEMENT = 'perspective-view-event-element';

class EventBus {
  bus: Element;

  constructor(name?: string) {
    this.bus = document.getElementsByTagName(name ?? PERSPECTIVE_VIEW_EVENT_ELEMENT)[0];

    if (!this.bus) {
      this.bus = document.createElement(name ?? PERSPECTIVE_VIEW_EVENT_ELEMENT);
    }

    document.body.append(this.bus)
  }

  addEventListener(event: string, callback: any) {
    this.bus.addEventListener(event, callback)
  }

  removeEventListener(event: string, callback: any) {
    this.bus.addEventListener(event, callback)
  }

  dispatchEvent(event: string, detail = {}) {
    this.bus.dispatchEvent(new CustomEvent(event, { detail }))
  }
}

const useEventEmitter = () => {
  const bus = ref(new EventBus());

  return bus;
}

export default useEventEmitter;