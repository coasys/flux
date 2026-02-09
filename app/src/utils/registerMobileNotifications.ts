import { Capacitor } from '@capacitor/core';

import { ActionPerformed, PushNotificationSchema, PushNotifications, Token } from '@capacitor/push-notifications';
import { Ad4mClient } from '@coasys/ad4m';

const APP_NAME = 'Flux';
const DESCRIPTION = 'Mobile push notifications for @-mentions';
function notificationConfig(perspectiveIds: string[], webhookAuth: string) {
  return {
    appName: APP_NAME,
    description: DESCRIPTION,
    appUrl: window.location.origin,
    appIconPath: window.location.origin + '/icon.png',
    trigger: `
      SELECT
        in.uri as message_id,
        fn::parse_literal(out.uri) as body_literal,
        fn::json_path(fn::parse_literal(out.uri), 'data') as message_content,
        fn::strip_html(fn::json_path(fn::parse_literal(out.uri), 'data')) as description,
        $agentDid as mentioned_agent
      FROM link
      WHERE predicate = 'msg://body'
      AND fn::contains(
        fn::json_path(fn::parse_literal(out.uri), 'data'),
        'data-type="mention" href="' + $agentDid + '"'
      )`
    ,
    perspectiveIds,
    webhookUrl: 'http://push-notifications.ad4m.dev:13000/notification',
    webhookAuth,
  };
}

export async function registerNotification(client: Ad4mClient) {
  const perspctives = await client.perspective.all();
  const perspectiveIds = perspctives.map((p) => p.uuid);

  let webhookAuth = '';

  if (Capacitor.isNativePlatform()) {
    console.log('Native platform detected');
    console.log('Requesting notification permission');

    const notificationPromise = new Promise<string>(async (resolve, reject) => {
      const result = await PushNotifications.requestPermissions();
      console.log('Notification permission result:', result);
      if (result.receive === 'granted') {
        console.log('Notification permission granted');
        await PushNotifications.register();
        console.log('Push registration success');

        localStorage.setItem('notificationRegistered', 'true');
      } else {
        console.error('Notification permission denied');
      }

      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        localStorage.setItem('notificationToken', token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.log('Error on registration: ' + JSON.stringify(error));
        reject(error);
      });
    });

    webhookAuth = await notificationPromise;

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  }

  let notifications = await client.runtime.notifications();
  let foundNotifications = notifications.filter(
    (n) =>
      n.appName == APP_NAME &&
      n.description == DESCRIPTION &&
      perspectiveIds.every((p) => n.perspectiveIds.includes(p)) &&
      n.granted &&
      n.webhookAuth == webhookAuth,
  );

  if (foundNotifications.length > 1) {
    for (let i = 1; i < foundNotifications.length; i++) {
      await client.runtime.removeNotification(foundNotifications[i].id);
    }
  }

  if (foundNotifications.length == 0) {
    await client.runtime.requestInstallNotification(notificationConfig(perspectiveIds, webhookAuth));
  }
}
