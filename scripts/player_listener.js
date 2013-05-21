
/**
 * Content script can't use JS object of the page, but they can access the DOM.
 * Use our own DIV to store info.
 * 
 * On page load, we add a listener to #current-track, which is a <A> element holding the song's title.
 * 
 * Deezer uses jQuery .text() method to update the content, which doesn't fire a DOMCharacterDataModified event 
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
				"function updateMyPlayerInfo()" +
				"{" +
					"myPlayerInfo = $('#myPlayerInfo');" +
					"myPlayerInfo.attr('dz_playing',     dzPlayer.isPlaying());" +
					"myPlayerInfo.attr('dz_artist',      dzPlayer.getArtistName());" +
					"myPlayerInfo.attr('dz_artist_id',  (dzPlayer.getCurrentSongInfo() != null ? dzPlayer.getCurrentSongInfo().ART_ID : ''));" +
					"myPlayerInfo.attr('dz_track',       dzPlayer.getSongTitle());" +
					"myPlayerInfo.attr('dz_album',       dzPlayer.getAlbumTitle());" +
					"myPlayerInfo.attr('dz_album_id',   (dzPlayer.getCurrentSongInfo() != null ? dzPlayer.getCurrentSongInfo().ALB_ID : ''));" +
					"myPlayerInfo.attr('dz_cover',       dzPlayer.getCover());" +
					"myPlayerInfo.attr('dz_prev_cover', (dzPlayer.getPrevSongInfo() != null ? dzPlayer.getPrevSongInfo().ALB_PICTURE : ''));" +
					"myPlayerInfo.attr('dz_next_cover', (dzPlayer.getNextSongInfo() != null ? dzPlayer.getNextSongInfo().ALB_PICTURE : ''));" +
					"myPlayerInfo.attr('dz_is_prev_active',   playercontrol.prevButtonActive());" +
					"myPlayerInfo.attr('dz_is_next_active',   playercontrol.nextButtonActive());" +
					"document.getElementById('lastUpdate').innerHTML = Math.floor(new Date().getTime());" + 
				"};" + 
				"document.getElementById('current-track').addEventListener('DOMNodeInserted', updateMyPlayerInfo , false);" +
				"(function() { orig = $.fn.show; $.fn.show = function() { var ev = new $.Event('show'); orig.apply(this, arguments); $(this).trigger(ev); }})();" +
				"$('#h_play, #h_pause').bind('show', function(e) { updateMyPlayerInfo(); });" +
				"updateMyPlayerInfo();"
			;
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
	chrome.extension.sendRequest({ type: "now_playing_updated", nowPlayingData: aDzAttributes });
}

// this will perform actions on the deezer page - sent by popup.html
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
{
	switch (request.name)
	{
		case "controlPlayer":
			// in case of media keys, we don't know if it's pause or play
			// compute !
			var aAction = request.action;
			if (aAction == 'playpause')
			{
				var aDzPlaying = document.getElementById('myPlayerInfo').getAttribute('dz_playing');
				aAction = aDzPlaying == "true" ? "pause" : "play";
			}
			
			// update dz_playing if needed
			if (aAction == "play" || aAction == "pause")
				document.getElementById('myPlayerInfo').setAttribute('dz_playing', aAction == "play" ? "true" : "false"); 
						
			sendJsonPlayerInfo(null); // thanks to this, changes on play / pause are tracked
			executeDoAction(aAction);
			break;
			
			
		case "doAction":			
			// special action linkCurrentArtist (doesn't exist on Deezer)
			if (request.action == 'linkCurrentArtist')
			{
				location.href = "javascript: loadBox('artist/" + document.getElementById('myPlayerInfo').getAttribute('dz_artist_id') + "')";
				break;
			}		
			
			executeDoAction(request.action);
			break;
    }
	
	// call the response callback to process the rest of the process
	sendResponse();
});

function executeDoAction(action)
{
	location.href = "javascript: if (typeof(playercontrol) != 'undefined') playercontrol.doAction('" + action + "');";	
}
