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
      multiUser: true,
      backendUrl: 'https://lucksus.ad4m.dev:12001/graphql'
    });
  }
  return ad4mConnectInstance;
}

// Export singleton instance for direct access (multi-user pattern)
export const ad4mConnect = getAd4mConnect();
