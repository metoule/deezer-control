
var gNowPlayingData = null;

// if not popup is set, it means that we should open a new Deezer tab
chrome.browserAction.onClicked.addListener(function(iTab) 
{
	chrome.tabs.create({ url: 'http://www.deezer.com' });
});


// this will search for all opened Deezer tabs
function countDeezerTabs()
{
	chrome.windows.getAll(
		{populate : true},
		function(windows) 
		{
			var aCurrentlyOpenedTabs = 0;
			var k = -1;
			
			for(var i = 0; i < windows.length; i++) 
			{
				for(var j = 0; j < windows[i].tabs.length; j++) 
				{
					if (windows[i].tabs[j].url.toLowerCase().indexOf('www.deezer.com') > 0)
					{
						aCurrentlyOpenedTabs++;
					}
				}
			}
			
			// store number of opened Deezer tabs in local storage
			LOCSTO.nbOpenedDeezerTabs = aCurrentlyOpenedTabs;
			LOCSTO.saveOptions();
			
			// set popup if needed
			shouldWeShowPopup();
		});	
}

// if at least one deezer tab, open a popup
function shouldWeShowPopup()
{	
	if (LOCSTO.nbOpenedDeezerTabs == 0)
		chrome.browserAction.setPopup({ popup: '' }); // no deezer tab is opened, so don't create a popup
	else
		chrome.browserAction.setPopup({ popup: '/popup.html' }); // at least one deezer tab is opened, create a popup
}

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
		
	case "update_deezer_tabs_nb":
		LOCSTO.nbOpenedDeezerTabs = LOCSTO.nbOpenedDeezerTabs + request.amount;
		LOCSTO.saveOptions();
		
		// set popup if needed
		shouldWeShowPopup();
		
		break;		
	}
});