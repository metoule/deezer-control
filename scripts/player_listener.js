 

// create an invisible fake div
if (document.getElementById('DeezerControlData') === null)
{
	var aDeezerControlDataDom = document.createElement('div');
	aDeezerControlDataDom.id = "DeezerControlData";
	aDeezerControlDataDom.style.display = 'none';
	
	// create a child to monitor and help force the info update
	var aLastUpdateDom = document.createElement('div');
	aLastUpdateDom.id = "lastUpdate";
	aDeezerControlDataDom.appendChild(aLastUpdateDom);
	document.body.appendChild(aDeezerControlDataDom);
	
	// inject a new JS script that can interact with the JS objects of the page
	var s = document.createElement('script');
	s.src = chrome.extension.getURL('scripts/player_observer_deezer.js');
	(document.head||document.documentElement).appendChild(s);
	s.onload = function() { "use strict"; s.parentNode.removeChild(s); };
	
	// add a listener for events on our new DIV, and post it to our extension
	var observer = new MutationObserver(sendJsonPlayerInfo);
	var config = { attributes: false, childList: true, characterData: true }; 
	observer.observe(document.getElementById('lastUpdate'), config);
}

// extract Deezer data
function getDeezerData()
{
	"use strict";
	
	// filter attributes to only keep those we want
	var aAllAttributes = document.getElementById('DeezerControlData').attributes,  
		aDzAttributes = {}, 
		i; 
	for (i = 0 ; i < aAllAttributes.length; i++) 
	{
		if (aAllAttributes[i].name.substring(0, 3) === "dz_")
		{
			if (aAllAttributes[i].value !== undefined)
			{
				aDzAttributes[aAllAttributes[i].name] = aAllAttributes[i].value;
			}
			else
			{
				aDzAttributes[aAllAttributes[i].name] = '';
			}
		}
	}
	
	return aDzAttributes;
}

// send player's data to the background page
function sendJsonPlayerInfo()
{
	"use strict";
	chrome.runtime.sendMessage({ type: "now_playing_updated", nowPlayingData: getDeezerData() });
}

// perform actions on the deezer page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	"use strict";
	
	var aAction = request.action, 
		aDzPlaying;

	// in case of media keys, we don't know if it's pause or play
	if (request.name === "controlPlayer" && aAction === "playpause")
	{
		aDzPlaying = document.getElementById('DeezerControlData').getAttribute('dz_playing');
		aAction = aDzPlaying === "true" ? "pause" : "play";
	}

	// possible action: play, pause, prev, next, linkCurrentSong, linkCurrentArtist
	location.href = "javascript: deezerControlMethod_" + aAction + "()";
	
	// no callback is used, return false
	return false;
});
