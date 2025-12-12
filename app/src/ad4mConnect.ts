import Ad4mConnectUI from '@coasys/ad4m-connect';

let ad4mConnectInstance: ReturnType<typeof Ad4mConnectUI> | null = null;

export function getAd4mConnect() {
  if (!ad4mConnectInstance) {
    console.log('Initializing ad4m-connect');
    ad4mConnectInstance = Ad4mConnectUI({
      appName: 'Flux',
      appDesc: 'A Social Toolkit for the New Internet',
      appUrl: window.location.origin,
      appDomain: window.location.origin,
      appIconPath: window.location.origin + '/icon.png',
      capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      hosting: false,
      mobile: true,
    });
  }
  return ad4mConnectInstance;
}
