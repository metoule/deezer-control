import { LocalStorage } from '../localstorage.js';

// save active tab any time it changes to be able to go back to it
chrome.tabs.onActivated.addListener(async (tabInfo) => {
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadSession();

  const windowId = tabInfo.windowId;
  const tabId = tabInfo.tabId;

  // ignore active tab if current active player: we don't want to go back to it!
  if (LOCSTO.session.playersTabs.indexOf(tabId) !== 0) {
    LOCSTO.session.jumpBackToActiveTab.windowId = windowId;
    LOCSTO.session.jumpBackToActiveTab.tabId = tabId;
    await LOCSTO.saveSession();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.type) {
      case 'updateSession':
        await updateSession(sender.tab, request.nowPlayingData);
        break;

      case 'remove_me':
        await removePlayerTabId(sender.tab.id);
        break;

      case 'getDeezerData':
        const LOCSTO = new LocalStorage();
        await LOCSTO.loadSession();
        sendResponse(LOCSTO.session.deezerData);
        break;
    }
  })();

  return true;
});

async function updateSession(playerTab, nowPlayingData) {
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadSession();

  console.log('updateSession', nowPlayingData);

  // player has just been loaded
  const playerTabId = playerTab.id;

  // check limit one page per player
  if (LOCSTO.session.playersTabs.indexOf(playerTabId) === -1) {
    if (LOCSTO.misc.limitDeezerToOneTab) {
      for (const tabIdStr in LOCSTO.session.playersData) {
        if (nowPlayingData.dz_name === LOCSTO.session.playersData[tabIdStr].dz_name) {
          // close opening tab
          chrome.tabs.remove(playerTabId);

          // move to already opened tab
          await jumpToTab(parseInt(tabIdStr, 10));
          return;
        }
      }
    }

    LOCSTO.session.playersTabs.push(playerTabId);
  }

  // player is inactive, remove it
  if (nowPlayingData.dz_is_active !== 'true') {
    removePlayerTabId(playerTabId);
    return;
  }

  // update player info
  LOCSTO.session.playersData[playerTabId] = nowPlayingData;

  // change of player?
  if (playerTabId !== LOCSTO.session.playersTabs[0]) {
    // current player is not playing / new player is playing
    if (LOCSTO.session.deezerData.dz_playing !== 'true' || nowPlayingData.dz_playing === 'true') {
      // stops current player
      await chrome.runtime.sendMessage({ type: 'controlPlayer', action: 'pause' });

      // reorder tabs order
      const index = LOCSTO.session.playersTabs.indexOf(playerTabId);
      LOCSTO.session.playersTabs.splice(index, 1);
      LOCSTO.session.playersTabs.splice(0, 0, playerTabId);

      LOCSTO.session.deezerData = nowPlayingData;
    }
  } else {
    // same player
    LOCSTO.session.deezerData = nowPlayingData;
  }

  await LOCSTO.saveSession();

  // reset the fact that action is on media key event
  //   gActionOnHotKey = false;
  //   gActionOnNotifButton = false;
}

// remove closing tab id from players tabs
chrome.tabs.onRemoved.addListener(removePlayerTabId);
async function removePlayerTabId(tabId) {
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadSession();

  const index = LOCSTO.session.playersTabs.indexOf(tabId);
  if (index > -1) {
    LOCSTO.session.playersTabs.splice(index, 1);

    // current player is closed, move to the next and resume playing
    if (index === 0 && LOCSTO.session.playersTabs.length > 0) {
      const isPlaying = LOCSTO.session.deezerData.dz_playing;
      LOCSTO.session.deezerData = LOCSTO.session.playersData[LOCSTO.session.playersTabs[0]];
      LOCSTO.session.deezerData.dz_playing = isPlaying;

      if (isPlaying === 'true') {
        chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'play' });
      }
    }
  }

  if (LOCSTO.session.playersData.hasOwnProperty(tabId)) {
    delete LOCSTO.session.playersData[tabId];
  }
}

async function jumpToTab(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab) {
    return;
  }

  chrome.windows.update(tab.windowId, { focused: true });
  chrome.tabs.update(tab.id, { selected: true });
}

async function cleanUpSession() {
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadSession();

  // clean up current players queue
  let len = LOCSTO.session.playersTabs.length;
  while (len--) {
    // check if tab is still opened
    const tabId = LOCSTO.session.playersTabs[len];
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      LOCSTO.session.playersTabs.splice(len, 1);
      if (LOCSTO.session.playersData.hasOwnProperty(tabId)) {
        delete LOCSTO.session.playersData[tabId];
      }
    }
  }

  await LOCSTO.saveSession();
}

cleanUpSession();
