
var gNowPlayingData = null;

// this will react to an event fired in player_listener.js
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
{
	switch (request.type)
	{
	case "now_playing_updated":
		gNowPlayingData = request.nowPlayingData;

		// update the button's tooltip
		if (gNowPlayingData != null)
			chrome.browserAction.setTitle({ title: gNowPlayingData.dz_track + ' - ' + gNowPlayingData.dz_artist });
		else
			chrome.browserAction.setTitle({ title: '' });
			
		// check if the popup is currently showing
		var aPopups = chrome.extension.getViews({ type: 'popup' });
		if (aPopups.length == 1)
		{
			// we have 1 popup: it means it's currently displayed, and needs to be refreshed
			aPopups[0].refreshPopup();
		}
		break;
	}
});