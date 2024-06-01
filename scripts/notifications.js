var NEW_NOTIFS = NEW_NOTIFS || {
  buttonPrev: { title: chrome.i18n.getMessage('playback_prev'), iconUrl: 'imgs/notifs/prev.png' },
  buttonPlay: { title: chrome.i18n.getMessage('playback_play'), iconUrl: 'imgs/notifs/play.png' },
  buttonPause: { title: chrome.i18n.getMessage('playback_pause'), iconUrl: 'imgs/notifs/pause.png' },
  buttonNext: { title: chrome.i18n.getMessage('playback_next'), iconUrl: 'imgs/notifs/next.png' },

  createNotif: function (forceRedisplay) {
    'use strict';
    var notifButtons, content, newData;

    // we're only allowed two buttons: display play/pause, and next
    notifButtons = [];
    notifButtons.push(LOCSTO.session.deezerData.dz_playing === 'true' ? this.buttonPause : this.buttonPlay);
    if (LOCSTO.session.deezerData.dz_is_next_active === 'true') {
      notifButtons.push(this.buttonNext);
    } else if (LOCSTO.session.deezerData.dz_is_prev_active === 'true') {
      notifButtons.push(this.buttonPrev);
    }

    content = {
      type: 'basic',
      title: LOCSTO.session.deezerData.dz_track,
      message: LOCSTO.session.deezerData.dz_artist,
      iconUrl: LOCSTO.session.deezerData.dz_cover,
      buttons: notifButtons,
      priority: 0,
    };

    newData = JSON.stringify(content);

    if (forceRedisplay === true) {
      this.destroyNotif(function () {
        LOCSTO.session.notifData = newData;
        chrome.notifications.create('deezer_control', content);
      });
    } else {
      // don't update notification if same data
      if (newData === LOCSTO.session.notifData) {
        return;
      }

      LOCSTO.session.notifData = newData;
      chrome.notifications.update('deezer_control', content);
    }
  },

  destroyNotif: function (callback) {
    'use strict';

    chrome.notifications.clear('deezer_control', function (/*wasCleared*/) {
      LOCSTO.session.notifData = null;
      if (callback) {
        callback();
      }
    });
  },

  buttonClicked: function (buttonIndex) {
    'use strict';

    var notifButton = JSON.parse(LOCSTO.session.notifData).buttons[buttonIndex];
    if (notifButton.title === this.buttonPrev.title) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'previoustrack', source: 'notif' });
    } else if (notifButton.title === this.buttonPlay.title) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'play', source: 'notif' });
    } else if (notifButton.title === this.buttonPause.title) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'pause', source: 'notif' });
    } else if (notifButton.title === this.buttonNext.title) {
      chrome.runtime.sendMessage({ type: 'controlPlayer', command: 'nexttrack', source: 'notif' });
    }
  },
};

var NOTIFS = null;
if (chrome.notifications !== undefined) {
  NOTIFS = NEW_NOTIFS;
  chrome.notifications.onClosed.addListener(function (notificationId /*, byUser*/) {
    'use strict';
    if (notificationId === 'deezer_control') {
      LOCSTO.session.notifData = null;
    }
  });

  chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    'use strict';
    if (notificationId === 'deezer_control') {
      NOTIFS.buttonClicked(buttonIndex);
    }
  });

  chrome.notifications.onClicked.addListener(function (notificationId) {
    'use strict';
    if (notificationId === 'deezer_control') {
      chrome.runtime.sendMessage({ type: 'jumpToDeezer', source: 'notif' });
    }
  });
}
