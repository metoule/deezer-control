var gActionOnHotKey = false; // this boolean will be used to show the notifs only on hotkey event
var gActionOnNotifButton = false; // this boolean will be used to show the notifs on notifs button click

// when the event page goes to sleep, remember session
chrome.runtime.onSuspend.addListener(function () {
  LOCSTO.saveSession();
});

function ignoreLastError() {
  var lastError = chrome.runtime.lastError;
  if (lastError !== undefined && lastError.message !== undefined) {
    //console.log(lastError.message);
  }
}

// this will react to an event fired in player_listener.js
chrome.runtime.onMessage.addListener(extensionOnMessageListener);
function extensionOnMessageListener(request, sender, sendResponse) {
  'use strict';

  switch (request.type) {
    case 'controlPlayer':
      gActionOnHotKey = request.source === 'hotkey';
      gActionOnNotifButton = request.source === 'notif';

      // send the wanted action to the deezer tab
      if (LOCSTO.session.playersTabs.length > 0) {
        chrome.tabs.sendMessage(LOCSTO.session.playersTabs[0], { name: request.type, action: request.command });
      }
      break;

    case 'doAction':
      if (LOCSTO.session.playersTabs.length > 0) {
        chrome.tabs.sendMessage(LOCSTO.session.playersTabs[0], { name: request.type, action: request.action });
        jumpToTab(LOCSTO.session.playersTabs[0]);
      }
      break;

    case 'jumpToDeezer':
      // find current active tab
      // if not deezer tab, jump to the deezer tab
      // if deezer tab, jump back to saved tab
      if (LOCSTO.session.playersTabs.length > 0) {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          // we're on the Deezer tab, go back to previous tab
          if (request.source !== 'notif' && tabs[0].id === LOCSTO.session.playersTabs[0]) {
            chrome.windows.update(LOCSTO.session.jumpBackToActiveTab.windowId, { focused: true });
            chrome.tabs.update(LOCSTO.session.jumpBackToActiveTab.tabId, { selected: true });
          }
          // not on the Deezer tab, find it and set it to active
          else {
            jumpToTab(LOCSTO.session.playersTabs[0]);
          }
        });
      }
      break;
  }

  return false;
}

function jumpToTab(iTabId) {
  chrome.tabs.get(iTabId, function (tab) {
    chrome.windows.update(tab.windowId, { focused: true });
    chrome.tabs.update(tab.id, { selected: true });
  });
}
