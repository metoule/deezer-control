import { LocalStorage } from './localstorage.js';

import './worker/install.js';
import './worker/session.js';
import './worker/actionbutton.js';
import './worker/optionalhotkeys.js';

async function executePlayerAction({ action, source }) {
  console.log('player', action, source);

  const LOCSTO = new LocalStorage();
  await LOCSTO.loadSession();

  // send the wanted action to the deezer tab
  if (LOCSTO.session.playersTabs.length > 0) {
    chrome.tabs.sendMessage(LOCSTO.session.playersTabs[0], { action });
  }
}

function executeDoAction({ action, source }) {
  console.log('do', action, source);
}
