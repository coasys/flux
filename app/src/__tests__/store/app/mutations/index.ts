import { useAppStore, useModalStore, useThemeStore, useUiStore } from '@/stores';
import { createPinia, Pinia, setActivePinia } from 'pinia';

describe('App Mutations', () => {
  let store: Pinia;
  let date: Date;

  beforeEach(() => {
    date = new Date();

    store = createPinia();

    setActivePinia(store);
  });

  test('toggleCommunitySidebar', () => {
    const uiStore = useUiStore();

    expect(uiStore.showCommunitySidebar).toBeTruthy();

    uiStore.toggleCommunitySidebar();

    expect(uiStore.showCommunitySidebar).toBeFalsy();
  });

  test('setCommunitySidebarOpen', () => {
    const uiStore = useUiStore();

    expect(uiStore.showCommunitySidebar).toBeTruthy();

    uiStore.setCommunitySidebarOpen(false);

    expect(uiStore.showCommunitySidebar).toBeFalsy();
  });

  test('setCurrentTheme', () => {
    const themeStore = useThemeStore();

    expect(themeStore.currentTheme).toBe('global');

    themeStore.setCurrentTheme('bebd2ac2-1e80-44d2-b807-0163c2bcef40');

    expect(themeStore.currentTheme).toBe('bebd2ac2-1e80-44d2-b807-0163c2bcef40');
  });

  test('setGlobalTheme', () => {
    const themeStore = useThemeStore();

    expect(themeStore.globalTheme).toStrictEqual({
      fontFamily: 'Poppins',
      fontSize: 'md',
      hue: 270,
      name: 'dark',
      saturation: 60,
    });

    // @ts-ignore
    themeStore.setGlobalTheme({ fontFamily: 'Arial', hue: 70 });

    expect(themeStore.globalTheme).toStrictEqual({
      fontFamily: 'Arial',
      fontSize: 'md',
      hue: 70,
      name: 'dark',
      saturation: 60,
    });
  });

  test('setToast', () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: '',
      open: false,
      message: '',
    });

    appStore.setToast({ message: 'error', open: true, variant: 'error' });

    expect(appStore.toast).toStrictEqual({
      variant: 'error',
      open: true,
      message: 'error',
    });
  });

  test('showSuccessToast', () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: '',
      open: false,
      message: '',
    });

    appStore.showSuccessToast({ message: 'success' });

    expect(appStore.toast).toStrictEqual({
      variant: 'success',
      open: true,
      message: 'success',
    });
  });

  test('showDangerToast', () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: '',
      open: false,
      message: '',
    });

    appStore.showDangerToast({ message: 'error' });

    expect(appStore.toast).toStrictEqual({
      variant: 'danger',
      open: true,
      message: 'error',
    });
  });

  test('setWindowState', () => {
    const uiStore = useUiStore();

    expect(uiStore.windowState).toBe('visible');

    uiStore.setWindowState('foreground');

    expect(uiStore.windowState).toBe('foreground');
  });

  test('setUpdateState', () => {
    const appStore = useAppStore();

    expect(appStore.updateState).toBe('not-available');

    appStore.setUpdateState({ updateState: 'available' });

    expect(appStore.updateState).toBe('available');
  });

  test('setGlobalLoading', () => {
    const uiStore = useUiStore();

    expect(uiStore.showGlobalLoading).toBeFalsy();

    uiStore.setGlobalLoading(true);

    expect(uiStore.showGlobalLoading).toBeTruthy();
  });

  test('setGlobalError', () => {
    const uiStore = useUiStore();

    expect(uiStore.globalError.show).toBeFalsy();
    expect(uiStore.globalError.message).toBe('');

    uiStore.setGlobalError({
      show: true,
      message: 'error',
    });

    expect(uiStore.globalError.show).toBeTruthy();
    expect(uiStore.globalError.message).toBe('error');
  });

  test('setShowCreateCommunity', () => {
    const modalStore = useModalStore();

    expect(modalStore.showCreateCommunity).toBeFalsy();

    modalStore.showCreateCommunity = true;

    expect(modalStore.showCreateCommunity).toBeTruthy();
  });

  test('setShowEditCommunity', () => {
    const modalStore = useModalStore();

    expect(modalStore.showEditCommunity).toBeFalsy();

    modalStore.showEditCommunity = true;

    expect(modalStore.showEditCommunity).toBeTruthy();
  });

  test('setShowCommunityMembers', () => {
    const modalStore = useModalStore();

    expect(modalStore.showCommunityMembers).toBeFalsy();

    modalStore.showCommunityMembers = true;

    expect(modalStore.showCommunityMembers).toBeTruthy();
  });

  test('setShowCreateChannel', () => {
    const modalStore = useModalStore();

    expect(modalStore.showCreateChannel).toBeFalsy();

    modalStore.showCreateChannel = true;

    expect(modalStore.showCreateChannel).toBeTruthy();
  });

  test('setShowEditProfile', () => {
    const modalStore = useModalStore();

    expect(modalStore.showEditProfile).toBeFalsy();

    modalStore.showEditProfile = true;

    expect(modalStore.showEditProfile).toBeTruthy();
  });

  test('setShowDisclaimer', () => {
    const modalStore = useModalStore();

    expect(modalStore.showDisclaimer).toBeTruthy();

    modalStore.showDisclaimer = false;

    expect(modalStore.showDisclaimer).toBeFalsy();
  });

  test('setShowSettings', () => {
    const modalStore = useModalStore();

    expect(modalStore.showSettings).toBeFalsy();

    modalStore.showSettings = true;

    expect(modalStore.showSettings).toBeTruthy();
  });

  test('setShowCommunitySettings', () => {
    const modalStore = useModalStore();

    expect(modalStore.showCommunitySettings).toBeFalsy();

    modalStore.showCommunitySettings = true;

    expect(modalStore.showCommunitySettings).toBeTruthy();
  });

  test('setShowInviteCode', () => {
    const modalStore = useModalStore();

    expect(modalStore.showInviteCode).toBeFalsy();

    modalStore.showInviteCode = true;

    expect(modalStore.showInviteCode).toBeTruthy();
  });
});
