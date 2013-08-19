
var gNowPlayingData = null;
var gActionOnHotKey = false; // this boolean will be used to show the notifs only on hotkey event
var gJumpBackToActiveTab = { windowsId: 0, tabId: 0 }; // remember active tab on which jump to Deezer was called

// actions to perform when the extension is loaded
$(window).load(windowOnLoadListener);
function windowOnLoadListener() 
{
	setUpPopup();
}

// if no popup is set, it means that we should open a new Deezer tab
chrome.browserAction.onClicked.addListener(browserActionOnClickListener);
function browserActionOnClickListener(iTab) 
{
	// extension has just been updated, a click will open the option page
	if (LOCSTO.shouldWeShowNewItems())
	{
		chrome.tabs.create({ url: '/options.html' });
		
		// user has seen what's new, restore normal use case
		chrome.browserAction.setBadgeText({ text: "" });
		LOCSTO.saveInstalledVersion();
		setUpPopup();
		
		updateButtonTooltip();
		propagatePlayingDataToAllTabs();
	}
	// else: normal use case
	else 
	{
		chrome.tabs.create({ url: 'http://www.deezer.com' });
	}
}

// inject hotkeys.js on any page if user allowed it
chrome.tabs.onUpdated.addListener(tabsOnUpdatedListener);
function tabsOnUpdatedListener(iTabId, iChangeInfo, iTab) 
{	
	// if user wants to limit Deezer to one tab, prevents any new Deezer tab from being opened
	checkLimitToOneDeezerTab(iTabId, iChangeInfo.url);
	
	// wait until loading is complete
	if (iChangeInfo.status != "complete")
		return;
	
	// ignore all chrome internal urls
	if (iTab.url.lastIndexOf("chrome", 0) !== 0)
	{
		chrome.permissions.contains(
		{
			origins: [ "<all_urls>" ] 
		}, 
		function(result) 
		{
			if (result)
				chrome.tabs.executeScript(iTabId, { file: "/scripts/hotkeys.js" });
		});
	}
	
	// recount number of opened deezer tabs
	setUpPopup();
}

// when a tab is opened, create the pop up if needed, and check number of opened deezer tabs
chrome.tabs.onCreated.addListener(tabsOnCreatedListener);
function tabsOnCreatedListener(iTab) 
{
	setUpPopup(); 
	checkLimitToOneDeezerTab(iTab.id, iTab.url); 
}

// when a tab is removed, check that the popup is still needed
chrome.tabs.onRemoved.addListener(tabsOnRemovedListener);
function tabsOnRemovedListener(iTabId, iRemoveInfo) 
{
	setUpPopup(); 
}

// save active tab any time it changes to be able to go back to it 
chrome.tabs.onActivated.addListener(tabsOnActivatedListener);
function tabsOnActivatedListener(iActiveTabInfo) 
{
	chrome.tabs.get(iActiveTabInfo.tabId, function(aActiveTab)
	{
		if (!aActiveTab) return;
		
		// ignore active tab if deezer: we don't want to go back to deezer tab!
		if (!matchDeezerUrl(aActiveTab.url))
		{
			gJumpBackToActiveTab.windowsId = aActiveTab.windowId;
			gJumpBackToActiveTab.tabId = aActiveTab.id;
		}
	});
}

// check whether we want to limit deezer to one tab
function checkLimitToOneDeezerTab(iTabId, iNewUrl)
{
	// if user wants to limit Deezer to one tab, prevents any new Deezer tab from being opened
	if (LOCSTO.miscOptions.limitDeezerToOneTab == true)
	{
		if (iNewUrl && matchDeezerUrl(iNewUrl))
		{
			// find any Deezer tab that's not this one
			findDeezerTab(function(iDeezerTabId, iDeezerWindowId)
			{
				if (iDeezerTabId == null)
					return;

				// close opening tab
				chrome.tabs.remove(iTabId);
				
				// switch to Deezer tab and update url to wanted url
				chrome.windows.update(iDeezerWindowId, { focused: true });
				chrome.tabs.update(iDeezerTabId, { selected: true });
			}, iTabId);
		}
	}
} 

// find any Deezer tab not matching iIgnoreTabId, and call the callback with its tab and window id
function findDeezerTab(iCallback, iIgnoreTabId)
{
	chrome.windows.getAll(
	{ populate : true },
	function(windows) 
	{
		for(var i = 0; i < windows.length; i++) 
		{
			var aWindow = windows[i];
			for(var j = 0; j < windows[i].tabs.length; j++) 
			{
				var aTab = aWindow.tabs[j];
				if (matchDeezerUrl(aTab.url))
				{
					if (aTab.id != iIgnoreTabId)
					{
						iCallback(aTab.id, aWindow.id);
						return;
					}
				}
			}
		}
		
		// no deezer tab found, pass null as arguments of the callback
		if (iCallback)
			iCallback(null, null);
	});
}


// set up the popup: if at least one deezer tab is opened, we'll show the popup
// otherwise, open a new deezer tab
function setUpPopup()
{
	// extension has just been updated, show new items
	if (LOCSTO.shouldWeShowNewItems())
	{
		chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
		chrome.browserAction.setBadgeText({ text: chrome.app.getDetails().version });
		chrome.browserAction.setTitle({ title: chrome.i18n.getMessage('showNewItemsTitle') });
		chrome.browserAction.setPopup({ popup: '' }); // don't create a popup, we want to open the options page
	} 
	// else: normal use case
	else
	{
		findDeezerTab(onFindDeezerTabForPopupSetup);
	}
}

function onFindDeezerTabForPopupSetup(iDeezerTabId)
{
	if (iDeezerTabId == null)
	{
		gNowPlayingData = null; // reset playing data
		chrome.browserAction.setTitle({ title: chrome.i18n.getMessage('defaultTitle') });
		chrome.browserAction.setPopup({ popup: '' }); // no deezer tab is opened, so don't create a popup
		NOTIFS.destroyNotif();
	}
	else
	{
		chrome.browserAction.setPopup({ popup: '/popup.html' }); // at least one deezer tab is opened, create a popup
	}
}

// this will react to an event fired in player_listener.js
chrome.extension.onRequest.addListener(extensionOnRequestListener);
function extensionOnRequestListener(request, sender, sendResponse) 
{
	switch (request.type)
	{
	case "now_playing_updated":
		gNowPlayingData = request.nowPlayingData;

		// update the button's tooltip only if no update should be shown
		if (!LOCSTO.shouldWeShowNewItems())
			updateButtonTooltip();
		
		propagatePlayingDataToAllTabs();
		
		// show / hide notif if needed
		showNotif();
		
		// call the callback method
		if (sendResponse)
			sendResponse();
		
		// reset the fact that action is on media key event
		gActionOnHotKey = false;
		
		break;

	case "controlPlayer":
		gActionOnHotKey = request.source == 'hotkey';
		
		// send the wanted action to the deezer tab
		findDeezerTab(function(iDeezerTabId) 
		{
			chrome.tabs.sendRequest(iDeezerTabId, { name: request.type, action: request.command }, function(response) { if (sendResponse) sendResponse(); });
		});
		
		break;

	case "doAction":		
		findDeezerTab(function(iDeezerTabId, iDeezerWindowId) 
		{
			chrome.tabs.sendRequest(iDeezerTabId, { name: request.type, action: request.action });
			onFindDeezerTabForJumpToDeezer(iDeezerTabId, iDeezerWindowId);
		});
		
		break;
		
	case "showNotif":
		gActionOnHotKey = request.source == 'hotkey' || request.source == 'options';
		
		// options page can change the style: force close the notif
		if (request.source == 'options')
			NOTIFS.destroyNotif();
		
		// show it
		showNotif();
		
		// call the callback method
		if (sendResponse)
			sendResponse();
		
		// reset the fact that action is on media key event
		gActionOnHotKey = false;
		
		break;
		
	case "jumpToDeezer":
		// find current active tab
		// if not deezer tab, jump to the deezer tab
		// if deezer tab, jump back to saved tab
		chrome.windows.getAll(
		{ populate : true },
		function(windows) 
		{
			for(var i = 0; i < windows.length; i++) 
			{
				// find window with focus
				if (!windows[i].focused)
					continue;
				
				// find the active tab
				for(var j = 0; j < windows[i].tabs.length; j++) 
				{
					if (windows[i].tabs[j].active)
					{
						// we're on the Deezer tab, go back to previous tab
						if (matchDeezerUrl(windows[i].tabs[j].url))
						{
							chrome.windows.update(gJumpBackToActiveTab.windowsId, { focused: true });
							chrome.tabs.update(gJumpBackToActiveTab.tabId, { selected: true });
						}
		
						// not on the Deezer tab, find it and set it to active
						else
						{
							findDeezerTab(onFindDeezerTabForJumpToDeezer);
						}
					}
				}
			}
		});
		break;
		
	case "getLOCSTO":
		LOCSTO.loadOptions(); // otherwise options might not be up to date
		sendResponse(LOCSTO);
		break;

	}
}

function onFindDeezerTabForJumpToDeezer(iDeezerTabId, iDeezerWindowId) 
{
	// we found a Deezer tab, switch to it
	chrome.windows.update(iDeezerWindowId, { focused: true });
	chrome.tabs.update(iDeezerTabId, { selected: true });
}

function showNotif()
{
	// if no deezer data, close notif, otherwise show it
	if (gNowPlayingData == null)
	{
		NOTIFS.destroyNotif();
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
			chrome.permissions.contains({ permissions: ['notifications'] }, onCheckNotifPermission);
		}
	}
}

function onCheckNotifPermission(iPermissionGranted)
{
    if (iPermissionGranted)
    	NOTIFS.createNotif();
    
    else
    	NOTIFS.destroyNotif();
}

function updateButtonTooltip()
{
	if (gNowPlayingData != null)
		chrome.browserAction.setTitle({ title: gNowPlayingData.dz_track + ' - ' + gNowPlayingData.dz_artist });
	else
		chrome.browserAction.setTitle({ title: '' });
}

function propagatePlayingDataToAllTabs()
{
	// refresh all opened popups, tabs (i.e. option page), and notifications
	chrome.extension.getViews({ type: 'tab' }).forEach(refreshPopupOnWindow);
	chrome.extension.getViews({ type: 'popup' }).forEach(refreshPopupOnWindow);
	NOTIFS.refreshNotif();
	
	if (gNowPlayingData != null)
	{
		// set images in background page to cache album covers for faster display
		loadStyle(); // load COVER_SIZE variable
		
		// load notification size image if needed
		if (!LOCSTO.notifications.never)
		{
			document.getElementById('prev_cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_prev_cover + "/" + COVER_SIZE_NOTIFS + "-000000-80-0-0.jpg";
			document.getElementById('cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/" + COVER_SIZE_NOTIFS + "-000000-80-0-0.jpg";
			document.getElementById('next_cover_small').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_next_cover + "/" + COVER_SIZE_NOTIFS + "-000000-80-0-0.jpg";
		}
		
		// load full image (might be the same size)
		document.getElementById('prev_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_prev_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
		document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
		document.getElementById('next_cover').src = "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_next_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
	}
}
function refreshPopupOnWindow(win) { win.refreshPopup(); }

function matchDeezerUrl(iUrl)
{
	return RegExp("^http(s)?://(www.)?deezer.com","gi").test(iUrl);
}
