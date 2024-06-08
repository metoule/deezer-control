import Version from './Version.js';

function fillDictWithDefaults(iDictWithRealValues, iDictWithDefaultValues) {
  'use strict';
  var aMyNewObject = {},
    key;

  if (iDictWithRealValues === null) {
    iDictWithRealValues = {};
  }

  // loop on all keys of iDictWithDefaultValues, and assign value to aMyNewObject if key not found in iDictWithRealValues
  // note: this will also remove any key in iDictWithRealValues not present in iDictWithDefaultValues
  for (key in iDictWithDefaultValues) {
    if (iDictWithDefaultValues.hasOwnProperty(key)) {
      if (iDictWithRealValues.hasOwnProperty(key)) {
        aMyNewObject[key] = iDictWithRealValues[key];
      } else {
        aMyNewObject[key] = iDictWithDefaultValues[key];
      }
    }
  }

  return aMyNewObject;
}

const defaultHotKeys = {
  playPause: {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    keyCode: 179,
  },
  prev: {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    keyCode: 177,
  },
  next: {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    keyCode: 176,
  },
  addToFavorite: {
    ctrlKey: false,
    altKey: true,
    shiftKey: false,
    keyCode: 76,
  },
  whatZatSong: {
    ctrlKey: false,
    altKey: true,
    shiftKey: false,
    keyCode: 87,
  },
  jumpToDeezer: {
    ctrlKey: false,
    altKey: true,
    shiftKey: false,
    keyCode: 74,
  },
};

export const hotkeyNames = Object.keys(defaultHotKeys);

//------------------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------------------
export class LocalStorage {
  async loadOptions() {
    const storage = await chrome.storage.sync.get('options');
    const options = storage.options || {};

    this.installedVersion = options.installedVersion || '0.0.0';
    this.popup = fillDictWithDefaults(options.popup, { style: 'large' });

    // notifications
    this.notifications = fillDictWithDefaults(options.notifications, {
      never: true,
      onSongChange: false,
      onHotKeyOnly: false,
    });

    // hot keys
    this.hotkeys = options.hotkeys || {};
    hotkeyNames.forEach((name) => {
      this.hotkeys[name] = fillDictWithDefaults(options.hotkeys[name], defaultHotKeys[name]);
    });

    // misc options
    this.misc = fillDictWithDefaults(options.misc, {
      limitDeezerToOneTab: true,
      hasHotkeysPermission: false,
    });

    // new options to show the user
    this.newOptionsToShow = options.hasNewOptions || false;
  }

  async loadSession() {
    const storage = await chrome.storage.sync.get('session');
    const session = storage.session || {};

    // session data, needed for event page reload
    // playersTabs: tab id of all opened players, ordered by playing order
    // playersData: infos on all opened players
    // deezerData: currently playing info
    this.session = fillDictWithDefaults(session, {
      playersTabs: [],
      playersData: {},
      deezerData: null,
      notifData: null,
      jumpBackToActiveTab: { windowId: 0, tabId: 0 },
    });
  }

  async updateModel() {
    const storage = await chrome.storage.sync.get('installedVersion');
    const installedVersion = new Version(storage.installedVersion);
    const extensionVersion = new Version(chrome.runtime.getManifest().version);

    // NOOP

    // model update finished, store newly installed version
    this.installedVersion = extensionVersion.toString();
    await chrome.storage.sync.set({
      installedVersion: extensionVersion.toString(),
    });
  }

  async saveOptions() {
    await chrome.storage.sync.set({
      options: {
        popup: this.popup,
        notifications: this.notifications,
        misc: this.misc,
        hasNewOptions: this.newOptionsToShow,
        hotkeys: this.hotkeys,
      },
    });
  }

  async saveSession() {
    await chrome.storage.sync.set({
      session: this.session,
    });
  }
}
