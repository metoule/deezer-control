import { LocalStorage } from '../localstorage.js';

const hotkeysPermissions = { origins: ['<all_urls>'] };

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== 'install' && details.reason !== 'update') {
    return;
  }

  // re-inject hotkeys on all opened tabs
  chrome.permissions.contains(hotkeysPermissions, (granted) => {
    if (granted) {
      injectHotKeysJsOnAllTabs();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.type) {
      case 'hotkey':
        processHotKey(request.action);
        break;

      case 'injectHotKeysJsOnAllTabs':
        injectHotKeysJsOnAllTabs();
        break;
    }
  })();

  return false;
});

// using sendResponse requires return true
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.type) {
      case 'loadHotKeys':
        sendResponse(await loadHotKeys());
        break;
    }
  })();

  return true;
});

// inject hotkeys.js on any page if user allowed it
chrome.webNavigation.onCommitted.addListener((details) => {
  chrome.permissions.contains(hotkeysPermissions, (granted) => {
    if (granted) {
      injectHotKeysJsOnTab(details);
    }
  });

  // recount number of opened player tabs
  //setUpPopup();
});

async function processHotKey(action) {
  switch (action) {
    case 'playPause':
    case 'next':
    case 'prev':
    case 'addToFavorite':
      await chrome.runtime.sendMessage({ type: 'controlPlayer', command: action, source: 'hotkey' });
      break;

    case 'whatZatSong':
    case 'jumpToDeezer':
      await chrome.runtime.sendMessage({ type: 'doAction', action: action, source: 'hotkey' });
      break;
  }
}

async function loadHotKeys() {
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadOptions();
  return LOCSTO.hotkeys;
}

function injectHotKeysJsOnTab(tab) {
  if (tab.frameId !== 0 || !tab.url.startsWith('http')) {
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id || tab.tabId },
    files: ['/scripts/hotkeys.js'],
  });
}

async function injectHotKeysJsOnAllTabs() {
  const windows = await chrome.windows.getAll({ populate: true });
  windows.forEach(async (window) => {
    window.tabs.forEach(async (tab) => {
      injectHotKeysJsOnTab(tab);
    });
  });
}
