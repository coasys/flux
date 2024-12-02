import { Capacitor } from "@capacitor/core";

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from "@capacitor/push-notifications";
import { Ad4mClient } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect";

const APP_NAME = "Flux"
const DESCRIPTION = "Mobile push notifications for @-mentions"
function notificationConfig(perspectiveIds: string[], webhookAuth: string) {
  return {
    appName: APP_NAME,
    description: DESCRIPTION,
    appUrl: window.location.origin,
    appIconPath: window.location.origin + "/icon.png",
    trigger: `
            agent_did(Did),
            subject_class("Message", C),
            instance(C, Base),
            property_getter(C, Base, "body", Body),
            literal_from_url(Body, JsonString, _),
            json_property(JsonString, "data", MessageContent),
            append("data-type=\\\"mention\\\" href=\\\"", Did, MentionString),
            string_includes(MessageContent, MentionString),
            remove_html_tags(MessageContent, Description),
            Title="You were mentioned".`,
    perspectiveIds,
    webhookUrl: "http://push-notifications.ad4m.dev:13000/notification",
    webhookAuth,
  }
}

export async function registerNotification() {
  const client: Ad4mClient = await getAd4mClient();
  const perspctives = await client.perspective.all();
  const perspectiveIds = perspctives.map((p) => p.uuid);

  let webhookAuth = ""

  if (Capacitor.isNativePlatform()) {
    console.log("Native platform detected");
    console.log("Requesting notification permission");

    const notificationPromise = new Promise<string>(async (resolve, reject) => {
      const result = await PushNotifications.requestPermissions();
      console.log("Notification permission result:", result);
      if (result.receive === "granted") {
        console.log("Notification permission granted");
        await PushNotifications.register();
        console.log("Push registration success");

        localStorage.setItem("notificationRegistered", "true");
      } else {
        console.error("Notification permission denied");
      }

      PushNotifications.addListener("registration", (token: Token) => {
        console.log("Push registration success, token: " + token.value);
        localStorage.setItem("notificationToken", token.value);
        resolve(token.value);
      });

      PushNotifications.addListener("registrationError", (error: any) => {
        console.log("Error on registration: " + JSON.stringify(error));
        reject(error);
      });
    });

    webhookAuth = await notificationPromise;

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push received: " + JSON.stringify(notification));
      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification: ActionPerformed) => {
        console.log("Push action performed: " + JSON.stringify(notification));
      }
    );
  }

  let notifications = await client.runtime.notifications()
  console.log("all notifications:", notifications)
  let foundNotifications = notifications.filter(n => {
    n.appName == APP_NAME && 
    n.description == DESCRIPTION &&
    perspectiveIds.every(p => n.perspectiveIds.includes(p)) &&
    n.granted &&
    n.webhookAuth == webhookAuth
  })
  console.log("matching notifications:", foundNotifications)

  if(foundNotifications.length > 1) {
    for(let i=1; i < foundNotifications.length; i++) {
      await client.runtime.removeNotification(foundNotifications[i].id)
    }
  }

  if(foundNotifications.length == 0)
    await client.runtime.requestInstallNotification(notificationConfig(perspectiveIds, webhookAuth))
  }
}
