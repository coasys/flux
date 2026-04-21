import { Capacitor } from '@capacitor/core';

import { ActionPerformed, PushNotificationSchema, PushNotifications, Token } from '@capacitor/push-notifications';
import { Ad4mClient } from '@coasys/ad4m';

const APP_NAME = 'Flux';
const WEBHOOK_URL = 'https://push.ad4m.dev/notification';

const MENTION_DESCRIPTION = 'Mobile push notifications for @-mentions';
function mentionNotificationConfig(perspectiveIds: string[], webhookAuth: string, agentDid: string) {
  return {
    appName: APP_NAME,
    description: MENTION_DESCRIPTION,
    appUrl: window.location.origin,
    appIconPath: window.location.origin + '/icon.png',
    trigger: `SELECT ?source ?predicate ?target WHERE {
      GRAPH ?g { ?source ?predicate ?target . }
      FILTER(?predicate = <msg://body>)
      FILTER(CONTAINS(
        LCASE(STR(<ad4m://fn/parse_literal>(?target))),
        LCASE('data-type="mention" href="${agentDid}"')
      ))
    }`,
    perspectiveIds,
    webhookUrl: WEBHOOK_URL,
    webhookAuth,
  };
}

const CALL_DESCRIPTION = 'Mobile push notifications for calls';
function callNotificationConfig(perspectiveIds: string[], webhookAuth: string, agentDid: string) {
  return {
    appName: APP_NAME,
    description: CALL_DESCRIPTION,
    appUrl: window.location.origin,
    appIconPath: window.location.origin + '/icon.png',
    trigger: `SELECT ?source ?predicate ?target WHERE {
      GRAPH ?g { ?source ?predicate ?target . }
      FILTER(?predicate = <agent/new-state>)
      FILTER(CONTAINS(STR(?source), '"inCall":true'))
      FILTER(!CONTAINS(STR(?source), '"${agentDid}"'))
    }`,
    perspectiveIds,
    webhookUrl: WEBHOOK_URL,
    webhookAuth,
  };
}

const CALL_INVITE_DESCRIPTION = 'Mobile push notifications for call invites';
function callInviteNotificationConfig(perspectiveIds: string[], webhookAuth: string, agentDid: string) {
  return {
    appName: APP_NAME,
    description: CALL_INVITE_DESCRIPTION,
    appUrl: window.location.origin,
    appIconPath: window.location.origin + '/icon.png',
    trigger: `SELECT ?source ?predicate ?target WHERE {
      GRAPH ?g { ?source ?predicate ?target . }
      FILTER(?predicate = <flux://call_invite>)
      FILTER(STR(?target) = "${agentDid}")
    }`,
    perspectiveIds,
    webhookUrl: WEBHOOK_URL,
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

  const agentStatus = await client.agent.status();
  const agentDid = agentStatus.did!;

  let notifications = await client.runtime.notifications();

  await ensureNotification(client, notifications, MENTION_DESCRIPTION, perspectiveIds, webhookAuth, agentDid, mentionNotificationConfig);
  await ensureNotification(client, notifications, CALL_DESCRIPTION, perspectiveIds, webhookAuth, agentDid, callNotificationConfig);
  await ensureNotification(client, notifications, CALL_INVITE_DESCRIPTION, perspectiveIds, webhookAuth, agentDid, callInviteNotificationConfig);
}

async function ensureNotification(
  client: Ad4mClient,
  notifications: any[],
  description: string,
  perspectiveIds: string[],
  webhookAuth: string,
  agentDid: string,
  configFn: (perspectiveIds: string[], webhookAuth: string, agentDid: string) => any,
) {
  let found = notifications.filter(
    (n) =>
      n.appName == APP_NAME &&
      n.description == description &&
      perspectiveIds.every((p) => n.perspectiveIds.includes(p)) &&
      n.granted &&
      n.webhookAuth == webhookAuth,
  );

  if (found.length > 1) {
    for (let i = 1; i < found.length; i++) {
      await client.runtime.removeNotification(found[i].id);
    }
  }

  if (found.length == 0) {
    await client.runtime.requestInstallNotification(configFn(perspectiveIds, webhookAuth, agentDid));
  }
}
