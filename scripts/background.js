
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
			
		// refresh all opened popups, tabs (i.e. option page), and notifications
		chrome.extension.getViews({ type: 'popup' }).forEach(function(win) { win.refreshPopup(); });
		chrome.extension.getViews({ type: 'tab' }).forEach(function(win) { win.refreshPopup(); });
		
		// update or create notification
		LOCSTO.loadOptions(); // otherwise options might not be up to date
		if (LOCSTO.notifications.visible)
		{
			var aAllNotifs = chrome.extension.getViews({ type: "notification" });
			if (aAllNotifs.length == 0)
			{
				var notification = webkitNotifications.createHTMLNotification("/popup.html?style=sideways");
				notification.show();

				// hide notification after the wanted delay
				if (!LOCSTO.notifications.alwaysOn)
				{
					// TODO stop timeout on mouse over
					// TODO restart time out on mouse out 
					// TODO restart time out on player change
					setTimeout(function() { notification.cancel(); }, LOCSTO.notifications.fadeAwayDelay);
				}
			} 
			else 
			{
				aAllNotifs.forEach(function(win) { win.refreshPopup(); });
			}
		}
		
		break;
	}
});