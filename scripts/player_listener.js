 

// create an invisible fake div
if (document.getElementById('DeezerControlData') == null)
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
	s.src = chrome.extension.getURL('scripts/player_observer.js');
	(document.head||document.documentElement).appendChild(s);
	s.onload = function() { s.parentNode.removeChild(s); };
	
	// add a listener for events on our new DIV, and post it to our extension
	var observer = new MutationObserver(function(mutations) { sendJsonPlayerInfo(); });
	var config = { attributes: false, childList: true, characterData: true }; 
	observer.observe(document.getElementById('lastUpdate'), config);
}

// send player's data to the background page
function sendJsonPlayerInfo()
{	
	// filter attributes to only keep those we want
	var aAllAttributes = document.getElementById('DeezerControlData').attributes; 
	var aDzAttributes = {}; 
	for (i = 0 ; i < aAllAttributes.length; i++) 
	{
		if (aAllAttributes[i].name.substring(0, 3) === "dz_")
		{
			if (typeof aAllAttributes[i].value !== 'undefined')
				aDzAttributes[aAllAttributes[i].name] = aAllAttributes[i].value;
			else
				aDzAttributes[aAllAttributes[i].name] = '';
		}
    }
	
	// send the results to background.html
	chrome.runtime.sendMessage({ type: "now_playing_updated", nowPlayingData: aDzAttributes });
}

// perform actions on the deezer page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	switch (request.name)
	{
		case "controlPlayer":
			// in case of media keys, we don't know if it's pause or play
			// compute !
			var aAction = request.action;
			if (aAction === 'playpause')
			{
				var aDzPlaying = document.getElementById('DeezerControlData').getAttribute('dz_playing');
				aAction = aDzPlaying === "true" ? "pause" : "play";
			}
						
			executeDoAction(aAction);
			break;
			
			
		case "doAction":			
			// special action linkCurrentArtist (doesn't exist on Deezer)
			if (request.action === 'linkCurrentArtist')
			{
				location.href = "javascript: loadBox('artist/" + document.getElementById('DeezerControlData').getAttribute('dz_artist_id') + "')";
				break;
			}		
			
			executeDoAction(request.action);
			break;
    }
	
	// no callback is used, return false
	return false;
});

function executeDoAction(action)
{
	location.href = "javascript: if (typeof(playercontrol) != 'undefined') playercontrol.doAction('" + action + "');";	
}

