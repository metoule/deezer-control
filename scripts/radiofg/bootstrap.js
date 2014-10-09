

// inject a new JS script that can interact with the JS objects of the page
var s = document.createElement('script');
s.src = chrome.extension.getURL('scripts/radiofg/player_observer.js');
(document.head||document.documentElement).appendChild(s);
s.onload = function() { "use strict"; s.parentNode.removeChild(s); };

// set player name
document.getElementById('DeezerControlData').setAttribute('dz_name', 'radiofg');