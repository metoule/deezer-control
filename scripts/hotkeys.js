function eventMatchHotKey(e, iHotKey) {
  'use strict';
  return (
    e.shiftKey === iHotKey.shiftKey &&
    e.altKey === iHotKey.altKey &&
    e.ctrlKey === iHotKey.ctrlKey &&
    e.keyCode === iHotKey.keyCode
  );
}

var HotKeysListener = function HotKeysListener() {
  window.addEventListener('keydown', this, false);
};

HotKeysListener.prototype.handleEvent = function (e) {
  'use strict';
  chrome.runtime.sendMessage({ type: 'getLOCSTO' }, function (LOCSTO) {
    if (!LOCSTO.miscOptions.hasHotkeysPermission) return;

    if (eventMatchHotKey(e, LOCSTO.prevHotKey)) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'previoustrack', source: 'hotkey' });
    } else if (eventMatchHotKey(e, LOCSTO.playPauseHotKey)) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'playpause', source: 'hotkey' });
    } else if (eventMatchHotKey(e, LOCSTO.nextHotKey)) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'nexttrack', source: 'hotkey' });
    } else if (eventMatchHotKey(e, LOCSTO.addToFavoriteHotKey)) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'like', source: 'hotkey' });
    } else if (eventMatchHotKey(e, LOCSTO.whatZatSongHotKey)) {
      chrome.runtime.sendMessage({ type: 'showNotif', source: 'hotkey' });
    } else if (eventMatchHotKey(e, LOCSTO.jumpToDeezerHotKey)) {
      chrome.runtime.sendMessage({ type: 'jumpToDeezer', source: 'hotkey' });
    }
  });
};

var HOTKEYS = HOTKEYS || new HotKeysListener();
