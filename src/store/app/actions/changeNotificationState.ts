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
    await Notification.requestPermission();
  } 

  appStore.setGlobalNotification(payload);
}
