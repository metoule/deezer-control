
var gCheckIfReady = new MutationObserver(function(mutations) 
{
	"use strict";
	
	if (!okForLoad())
		return;

	loadObserver();
	this.disconnect(); // stop observing
});


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

// do we have the elements needed to work?
function okForLoad()
{
	return document.querySelector(".player-track-title span") !== null;
}

function bootstrap()
{
	if (document.readyState !== "complete")
		return;
	
	// everything might already be loaded
	if (okForLoad())
	{
		loadObserver();
		return;
	}	

	// delay insertion until the elements we want are added
	var sidebar = document.getElementById("page_sidebar");
	if (sidebar === null)
	{
		// can't find the sidebar to monitor load - abort
		document.getElementById('removeMe').textContent = "now";
		return;
	}
		
	gCheckIfReady.observe(sidebar, { subtree: true, childList: true });
}

document.addEventListener("readystatechange", bootstrap);
bootstrap(); // for extension reload