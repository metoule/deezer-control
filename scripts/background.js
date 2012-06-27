
var gNowPlayingData = null;
var gNotification = null;
var gNotificationTimeoutId = null;

// if not popup is set, it means that we should open a new Deezer tab
chrome.browserAction.onClicked.addListener(function(iTab) 
{
	chrome.tabs.create({ url: 'http://www.deezer.com' });
});


// all opened Deezer tabs, and store the number found 
// this will be used to prevent popup from showing if no tab's opened
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
			
			// set popup to show up if at least one tab
			shouldWeShowPopup();
		});	
}

// if at least one deezer tab, open a popup
function shouldWeShowPopup()
{	
	if (LOCSTO.nbOpenedDeezerTabs <= 0)
	{
		LOCSTO.nbOpenedDeezerTabs = 0; // ensure we're always at 0 to avoid unwanted situations
		LOCSTO.saveOptions();
		chrome.browserAction.setPopup({ popup: '' }); // no deezer tab is opened, so don't create a popup
	}
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
		
		// if no deezer data, close notif, otherwise show it
		if (gNowPlayingData == null)
		{
			resetNotifTimeout(); // remove existing timeout
			closeNotif();
		}
		// we have data to show
		else
		{
			// set images in background page to cache album covers for faster display
			loadStyle(); // load COVER_SIZE variable
			document.getElementById('prev_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_prev_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
			document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
			document.getElementById('next_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_next_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
			
			
			// update or create notification
			LOCSTO.loadOptions(); // otherwise options might not be up to date
			if (LOCSTO.notifications.visible)
			{
				// if notif not already visible, create it
				if (gNotification == null)
				{
					gNotification = webkitNotifications.createHTMLNotification("/popup.html?style=sideways");
					gNotification.show();
				} 
				// else, we already have a notif opened
				else 
				{
					resetNotifTimeout(); // remove existing timeout
					chrome.extension.getViews({ type: "notification" }).forEach(function(win) { win.refreshPopup(); });
				}
	
				// hide notification after the wanted delay
				if (!LOCSTO.notifications.alwaysOn)
				{
					// TODO stop timeout on mouse over
					// TODO restart time out on mouse out
					gNotificationTimeoutId = setTimeout("closeNotif()", LOCSTO.notifications.fadeAwayDelay);
				}
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
	
	// call the callback method
	sendResponse();
});

// reset time out
function resetNotifTimeout()
{
	if (gNotificationTimeoutId != null)
	{
		window.clearTimeout(gNotificationTimeoutId);
		gNotificationTimeoutId = null;
	}
}

// close notif and reset everything
function closeNotif()
{
	if (gNotification != null) 
		gNotification.cancel(); 
	
	gNotification = null; 
	gNotificationTimeoutId = null;
}
