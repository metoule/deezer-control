
var gNowPlayingData = null;
var gNotification = null;
var gNotificationTimeoutId = null;
var gActionOnHotKey = false; // this boolean will be used to show the notifs only on hotkey event

window.addEventListener('load', countDeezerTabs(), false);

// if not popup is set, it means that we should open a new Deezer tab
chrome.browserAction.onClicked.addListener(function(iTab) 
{
	chrome.tabs.create({ url: 'http://www.deezer.com' });
});

// inject hotkeys.js on any page if user allowed it
chrome.tabs.onUpdated.addListener(function(iTabId, iChangeInfo, iTab) 
{
	// wait until loading is complete
	if (iChangeInfo.status != "complete")
		return;
	
	chrome.permissions.contains(
		{ origins: ['<all_urls>'] }, 
		function(result) 
		{
		    if (result)
		    {
		    	chrome.tabs.executeScript(iTabId, { file: "/scripts/hotkeys.js" });
		    }
		});
});

// all opened Deezer tabs, and store the number found 
// this will be used to prevent popup from showing if no tab's opened
function countDeezerTabs()
{
	chrome.windows.getAll(
		{ populate : true },
		function(windows) 
		{
			var aCurrentlyOpenedTabs = 0;
			
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
		chrome.browserAction.setTitle({ title: chrome.i18n.getMessage('defaultTitle') });
		chrome.browserAction.setPopup({ popup: '' }); // no deezer tab is opened, so don't create a popup
	}
	else
	{
		chrome.browserAction.setPopup({ popup: '/popup.html' }); // at least one deezer tab is opened, create a popup
	}
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
		chrome.extension.getViews({ type: 'tab' }).forEach(function(win) { win.refreshPopup(); });
		chrome.extension.getViews({ type: 'popup' }).forEach(function(win) { win.refreshPopup(); });
		chrome.extension.getViews({ type: "notification" }).forEach(function(win) { win.refreshPopup(); });
		
		if (gNowPlayingData != null)
		{
			// set images in background page to cache album covers for faster display
			loadStyle(); // load COVER_SIZE variable
			
			// load notification size image
			document.getElementById('prev_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_prev_cover + "/" + COVER_SIZE_SIDEWAYS + "-000000-80-0-0.jpg";
			document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/" + COVER_SIZE_SIDEWAYS + "-000000-80-0-0.jpg";
			document.getElementById('next_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_next_cover + "/" + COVER_SIZE_SIDEWAYS + "-000000-80-0-0.jpg";
						
			// load full image (might be the same size)
			document.getElementById('prev_cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_prev_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
			document.getElementById('cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
			document.getElementById('next_cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_next_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
		}
		
		// show / hide notif if needed
		showNotif();
		
		// call the callback method
		if (sendResponse)
			sendResponse();
		
		// reset the fact that action is on media key event
		gActionOnHotKey = false;
		
		break;
		
	case "update_deezer_tabs_nb":
		countDeezerTabs();
		LOCSTO.nbOpenedDeezerTabs = LOCSTO.nbOpenedDeezerTabs + request.amount;
		LOCSTO.saveOptions();
		
		// set popup if needed
		shouldWeShowPopup();
		
		// call the callback method
		if (sendResponse)
			sendResponse();
		
		break;

	case "controlPlayer":
		gActionOnHotKey = request.source == 'hotkey';
		
		// find all deezer tabs on all the windows, and send the wanted request to each one
		chrome.windows.getAll(
			{populate : true},
			function(windows) 
			{				
				for(var i = 0; i < windows.length; i++) 
				{
					for(var j = 0; j < windows[i].tabs.length; j++) 
					{
						if (windows[i].tabs[j].url.toLowerCase().indexOf('www.deezer.com') > 0)
						{
							var aDeezerTabId =  windows[i].tabs[j].id;
							chrome.tabs.sendRequest(aDeezerTabId, {name: request.type, action: request.command}, function(response) { if (sendResponse) sendResponse(); });
						}
					}
				}
			});	
		
		break;
		
	case "showNotif":
		gActionOnHotKey = request.source == 'hotkey' || request.source == 'options';
		showNotif();
		
		// call the callback method
		if (sendResponse)
			sendResponse();
		
		// reset the fact that action is on media key event
		gActionOnHotKey = false;
		
		break;
		
	case "getLOCSTO":
		LOCSTO.loadOptions(); // otherwise options might not be up to date
		sendResponse(LOCSTO);
		break;
	}
});

function showNotif()
{	
	// if no deezer data, close notif, otherwise show it
	if (gNowPlayingData == null)
	{
		resetNotifTimeout(); // remove existing timeout
		closeNotif();
	}
	// we have data to show
	else
	{		
		// update or create notification
		LOCSTO.loadOptions(); // otherwise options might not be up to date
		if (   !LOCSTO.notifications.never
			&& (   LOCSTO.notifications.alwaysOn 
			    || LOCSTO.notifications.visible /* on_song_change*/
			    || (LOCSTO.notifications.onHotKeyOnly && gActionOnHotKey)
			   )
		   )
		{			
			// if we don't have permission to display notifications, close notif if present
			chrome.permissions.contains(
				{ permissions: ['notifications'] }, 
				function(result) 
				{
				    if (result)
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
						}
			
						// hide notification after the wanted delay
						if (!LOCSTO.notifications.alwaysOn)
						{
							// TODO stop timeout on mouse over
							// TODO restart time out on mouse out
							gNotificationTimeoutId = setTimeout(closeNotif, LOCSTO.notifications.fadeAwayDelay);
						}
				    }
				    // not authorized, remove notif
				    else
				    {
						resetNotifTimeout(); // remove existing timeout
						closeNotif();
				    }
				});
		}
	}
}

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
