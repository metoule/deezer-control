

/**
 * Content script can't use JS object of the page, but they can access the DOM.
 * Use our own DIV to store info.
 * 
 * On page load, we add a listener to #current-track, which is a <A> element holding the song's title.
 * 
 * Deezer used jQuery .text() method to update the content, which doesn't fire a DOMCharacterDataModified event 
 * but a DOMNodeRemoved followed by a DOMNodeInserted - thus the event we listen to.
 * 
 * When a DOMNodeInserted is fired, we update our myPlayerInfo <DIV>, and update our other <DIV>, lastUpdate.
 * This time, since we use innerHTML, the event fired is DOMCharacterDataModified. We listen to that event, 
 * and send the resulting player info to background.html to store it for use in the popup.
 * 
 */ 
document.addEventListener('load', function(e) 
{
	if (document.getElementById('myPlayerInfo') == null)
	{		
		// create an invisible fake div
		var aMyPlayerInfoDom = document.createElement('div');
		aMyPlayerInfoDom.id = "myPlayerInfo";
		aMyPlayerInfoDom.style.display = 'none';
		// create a child to monitor and help force the info update
		var aLastUpdateDom = document.createElement('div');
		aLastUpdateDom.id = "lastUpdate";
		aMyPlayerInfoDom.appendChild(aLastUpdateDom);
		document.getElementsByTagName("body")[0].appendChild(aMyPlayerInfoDom);
		
		// inject a new JS method in the DOM 
		if (document.getElementById('current-track') != null 
		  && document.getElementById('h_play') != null
		  && document.getElementById('h_pause') != null) 
		{
			location.href = "javascript:" +
				"function updateMyPlayerInfo() {" +
				"myPlayerInfo = document.getElementById('myPlayerInfo');" +
				"myPlayerInfo.setAttribute('dz_playing', dzPlayer.isPlaying());" +
				"myPlayerInfo.setAttribute('dz_artist',  dzPlayer.getArtistName());" +
				"myPlayerInfo.setAttribute('dz_track',   dzPlayer.getSongTitle());" +
				"myPlayerInfo.setAttribute('dz_album',   dzPlayer.getAlbumTitle());" +
				"myPlayerInfo.setAttribute('dz_cover',   dzPlayer.getCover());" +
				"myPlayerInfo.setAttribute('dz_is_prev_active',   playercontrol.prevButtonActive());" +
				"myPlayerInfo.setAttribute('dz_is_next_active',   playercontrol.nextButtonActive());" +
				"document.getElementById('lastUpdate').innerHTML = Math.floor(new Date().getTime());" + 
			"};" + 
			"document.getElementById('current-track').addEventListener('DOMNodeInserted', updateMyPlayerInfo , false);" +
			"document.getElementById('h_play').addEventListener('click', updateMyPlayerInfo , false);" +
			"document.getElementById('h_pause').addEventListener('click', updateMyPlayerInfo , false);" + 
			"updateMyPlayerInfo();"
			;
			
			// we have one more deezer tab opened
			chrome.extension.sendRequest({ type: "update_deezer_tabs_nb", amount: +1 }, function(response) { return true; });
		}
		
		// add a listener for events on our new DIV, and post it to our extension
		document.getElementById('lastUpdate').addEventListener('DOMCharacterDataModified', sendJsonPlayerInfo, false);
	}
} , true);

function sendJsonPlayerInfo(event)
{	
	// filter attributes to only keep those we want
	var aAllAttributes = document.getElementById('myPlayerInfo').attributes; 
	var aDzAttributes = {}; 
	for (i = 0 ; i < aAllAttributes.length; i++) 
	{
		if (aAllAttributes[i].name.substring(0, 3) == "dz_")
		{
			aDzAttributes[aAllAttributes[i].name] = aAllAttributes[i].value;
		}
    }
	
	// send the results to background.html
	chrome.extension.sendRequest({ type: "now_playing_updated", nowPlayingData: aDzAttributes }, function(response) { return true; });
}

// this will perform actions on the deezer page - sent by popup.html
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
{
	switch (request.name)
	{
		case "controlPlayer":
			location.href = "javascript: if (typeof(playercontrol) != 'undefined') playercontrol.doAction('" + request.action + "');";
			break;
    }
	
	// call the response callback to process the rest of the process
	sendResponse();
});

window.addEventListener('unload', function(e) 
{	
	// we have one less deezer tab opened
	chrome.extension.sendRequest({ type: "update_deezer_tabs_nb", amount: -1 }, function(response) { return true; });
	chrome.extension.sendRequest({ type: "now_playing_updated", nowPlayingData: null }, function(response) { return true; });
});
