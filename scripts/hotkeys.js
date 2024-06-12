var deezerControlHotKeys;
if (!deezerControlHotKeys) {
  function eventMatchHotKey(e, iHotKey) {
    return (
      e.shiftKey === iHotKey.shiftKey &&
      e.altKey === iHotKey.altKey &&
      e.ctrlKey === iHotKey.ctrlKey &&
      e.keyCode === iHotKey.keyCode
    );
  }

  function handleEvent(e) {
    Object.keys(deezerControlHotKeys).forEach((hotkey) => {
      if (eventMatchHotKey(e, deezerControlHotKeys[hotkey])) {
        chrome.runtime.sendMessage({ type: 'hotkey', action: hotkey });
      }
    });
  }

  // TODO access storage here to get hotkeys chrome.storage.sync.get()
  // TODO add chrome.storage.onChanged listener to update hotkeys

  chrome.runtime.sendMessage({ type: 'loadHotKeys' }).then((hotkeys) => {
    deezerControlHotKeys = hotkeys;
    window.addEventListener('keydown', handleEvent, false);
  });
}
