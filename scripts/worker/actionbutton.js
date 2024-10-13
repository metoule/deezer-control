import { LocalStorage } from '../localstorage.js';

// if no popup is set, it means that we should open a new tab with default player
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://www.deezer.com' });
});

// if no popup is set, it means that we should open a new tab with default player
// chrome.action.onClicked.addListener(function () {
//   'use strict';

//   // extension has just been updated, a click will open the option page
//   if (LOCSTO.newOptionsToShow) {
//     chrome.tabs.create({ url: '/options.html' });

//     // user has seen what's new, restore normal use case
//     LOCSTO.newOptionsToShow = false;
//     LOCSTO.saveNewOptionsToShow();

//     chrome.action.setBadgeText({ text: '' });
//     setUpPopup();

//     propagatePlayingDataToAllTabs();
//   }
//   // else: normal use case
//   else {
//     // TODO add default player
//     chrome.tabs.create({ url: 'http://www.deezer.com' });
//   }
// });

// set up the popup: if at least one deezer tab is opened, we'll show the popup
// otherwise, open a new deezer tab
// function setUpPopup() {
//   'use strict';

//   // extension has just been updated, show new items
//   if (LOCSTO.newOptionsToShow) {
//     chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
//     chrome.action.setBadgeText({ text: chrome.app.getDetails().version });
//     chrome.action.setTitle({ title: chrome.i18n.getMessage('showNewItemsTitle') });
//     chrome.action.setPopup({ popup: '' }); // don't create a popup, we want to open the options page
//   }
//   // else: normal use case
//   else if (LOCSTO.session.playersTabs.length === 0) {
//     LOCSTO.session.deezerData = null; // reset playing data
//     chrome.action.setTitle({ title: chrome.i18n.getMessage('defaultTitle') });
//     chrome.action.setPopup({ popup: '' }); // no deezer tab is opened, so don't create a popup
//     NOTIFS.destroyNotif();
//   } else {
//     chrome.action.setPopup({ popup: '/popup.html' }); // at least one deezer tab is opened, create a popup
//   }
// }

function updateActionTitle(nowPlayingData) {
  const track = nowPlayingData?.dz_track;
  const artist = nowPlayingData?.dz_artist;
  const newTitle = track && artist ? track + ' - ' + artist : undefined;
  chrome.action.setTitle({ title: newTitle });
  chrome.action.setPopup({ popup: '/popup.html' });
}

function setupOpenDeezerAction() {
  chrome.action.setTitle({ title: chrome.i18n.getMessage('defaultTitle') });
  chrome.action.setPopup({ popup: '' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'updateSession':
      updateActionTitle(request.nowPlayingData);
      break;
  }

  return false;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'session') {
    return;
  }

  if (changes.session && changes.session.newValue.playersTabs.length === 0) {
    setupOpenDeezerAction();
  }
});
