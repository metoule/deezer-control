
function loadObserver()
{
	// inject a new JS script that can interact with the JS objects of the page
	var s = document.createElement('script');
	s.src = chrome.extension.getURL('scripts/deezer/player_observer.js');
	(document.head||document.documentElement).appendChild(s);
	s.onload = function() { "use strict"; s.parentNode.removeChild(s); };
	
	// set player name
	document.getElementById('DeezerControlData').setAttribute('dz_name', 'deezer');
}

function bootstrap()
{
	if (document.readyState !== "complete") {
		return;
	}

    loadObserver();
}

document.addEventListener("readystatechange", bootstrap);
bootstrap(); // for extension reload