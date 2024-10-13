// create an invisible fake div
function removeDeezerData() {
  if (document.getElementById('DeezerControlData') !== null) {
    var toRemove = document.getElementById('DeezerControlData');
    toRemove.parentNode.removeChild(toRemove);
  }
}
removeDeezerData();

var aDeezerControlDataDom = document.createElement('div');
aDeezerControlDataDom.id = 'DeezerControlData';
aDeezerControlDataDom.style.display = 'none';

// create a child to monitor and help force the info update
var aLastUpdateDom = document.createElement('div');
aLastUpdateDom.id = 'lastUpdate';
aDeezerControlDataDom.appendChild(aLastUpdateDom);

var aRemoveMeDom = document.createElement('div');
aRemoveMeDom.id = 'removeMe';
aDeezerControlDataDom.appendChild(aRemoveMeDom);

document.body.appendChild(aDeezerControlDataDom);

// add a listener for events on our new DIV, and post it to our extension
var observer = new MutationObserver(sendJsonPlayerInfo);
observer.observe(document.getElementById('lastUpdate'), { attributes: false, childList: true, characterData: true });

// add a listener to remove deezer data if no player is present on the page
var observer2 = new MutationObserver(function () {
  removeDeezerData();
  chrome.runtime.sendMessage({ type: 'remove_me' });
});
observer2.observe(document.getElementById('removeMe'), { attributes: false, childList: true, characterData: true });

// extract Deezer data
function getDeezerData() {
  'use strict';

  // filter attributes to only keep those we want
  var aAllAttributes = document.getElementById('DeezerControlData').attributes,
    aDzAttributes = {},
    i;
  for (i = 0; i < aAllAttributes.length; i++) {
    if (aAllAttributes[i].name.substring(0, 3) === 'dz_') {
      if (aAllAttributes[i].value !== undefined) {
        aDzAttributes[aAllAttributes[i].name] = aAllAttributes[i].value;
      } else {
        aDzAttributes[aAllAttributes[i].name] = '';
      }
    }
  }

  return aDzAttributes;
}

// send player's data to the background page
function sendJsonPlayerInfo() {
  'use strict';
  chrome.runtime.sendMessage({ type: 'updateSession', nowPlayingData: getDeezerData() });
}

// perform actions on the deezer page
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  'use strict';

  // possible action: play, pause, previoustrack, nexttrack, like, linkCurrentSong, linkCurrentArtist
  document.getElementById('DeezerControlData').dispatchEvent(
    new CustomEvent('deezerControl', {
      detail: {
        action: request.action,
      },
    })
  );

  // no callback is used, return false
  return false;
});
