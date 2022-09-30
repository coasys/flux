import { useAppStore } from "@/store/app/index";

export interface Payload {
  communityId: string;
  name: string;
  description: string;
}

export default async function changeNotificationState(
  payload: boolean
): Promise<void> {
  const appStore = useAppStore();

  if (payload) {
    const state = await Notification.requestPermission();

    if (state === 'denied') {
      appStore.setGlobalNotification(false);

      return;
    } 
  }

  appStore.setGlobalNotification(payload);
}
