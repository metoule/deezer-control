
var gActionOnHotKey = false; // this boolean will be used to show the notifs only on hotkey event
var gActionOnNotifButton = false; // this boolean will be used to show the notifs on notifs button click

// actions to perform when the extension is loaded
$(window).load(setUpPopup);

// when the event page goes to sleep, remember session
chrome.runtime.onSuspend.addListener(function() { LOCSTO.saveSession(); });

// install, update, or chrome update
chrome.runtime.onInstalled.addListener(function(details)
{
	"use strict";
	
	// inject content script on Deezer tab
	if (details.reason === "install" || details.reason === "update")
	{
		findDeezerTab(function(iDeezerTabId)
		{
			if (iDeezerTabId === null)
			{
				return;
			}

			chrome.tabs.executeScript(iDeezerTabId, { file: "/scripts/player_listener.js" });
		});
		
		// re-inject hotkeys on all opened tabs
		chrome.permissions.contains({ origins: [ "<all_urls>" ] }, function(granted) 
		{
			if (granted)
			{
				extensionOnMessageListener({ type: 'injectHotKeysJsOnAllTabs' });
			}
		});
	}
	
	// update local storage if needed
	if (details.reason === "update")
	{
		LOCSTO.updateModel();
	}
});

// if no popup is set, it means that we should open a new Deezer tab
chrome.browserAction.onClicked.addListener(browserActionOnClickListener);
function browserActionOnClickListener(/*iTab*/) 
{
	"use strict";
	
	// extension has just been updated, a click will open the option page
	if (LOCSTO.newOptionsToShow)
	{
		chrome.tabs.create({ url: '/options.html' });
		
		// user has seen what's new, restore normal use case
		LOCSTO.newOptionsToShow = false;
		LOCSTO.saveNewOptionsToShow();
		
		chrome.browserAction.setBadgeText({ text: "" });
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
chrome.webNavigation.onCommitted.addListener(function(data) 
{
	"use strict";
	
	// ignore sub frames
	if (data.frameId !== 0)
	{
		return;
	}
	
	// if user wants to limit Deezer to one tab, prevents any new Deezer tab from being opened
	checkLimitToOneDeezerTab(data.tabId, data.url);
	
	chrome.permissions.contains({ origins: [ "<all_urls>" ] }, function(granted) 
	{
		if (granted)
		{
			chrome.tabs.executeScript(data.tabId, { file: "/scripts/hotkeys.js", runAt: "document_start" });
		}
	});

	// recount number of opened deezer tabs
	setUpPopup();
});

// when a tab is removed, check that the popup is still needed
chrome.tabs.onRemoved.addListener(setUpPopup);

// save active tab any time it changes to be able to go back to it 
chrome.tabs.onActivated.addListener(tabsOnActivatedListener);
function tabsOnActivatedListener(iActiveTabInfo) 
{
	"use strict";
	chrome.tabs.get(iActiveTabInfo.tabId, function(aActiveTab)
	{
		if (!aActiveTab)
		{
			return;
		}
		
		// ignore active tab if deezer: we don't want to go back to deezer tab!
		if (!matchDeezerUrl(aActiveTab.url))
		{
			LOCSTO.session.jumpBackToActiveTab.windowsId = aActiveTab.windowId;
			LOCSTO.session.jumpBackToActiveTab.tabId = aActiveTab.id;
		}
	});
}

// check whether we want to limit deezer to one tab
function checkLimitToOneDeezerTab(iTabId, iNewUrl)
{
	"use strict";
	
	// if user wants to limit Deezer to one tab, prevents any new Deezer tab from being opened
	if (LOCSTO.miscOptions.limitDeezerToOneTab === true)
	{
		if (iNewUrl && matchDeezerUrl(iNewUrl))
		{
			// find any Deezer tab that's not this one
			findDeezerTab(function(iDeezerTabId, iDeezerWindowId)
			{
				if (iDeezerTabId === null)
				{
					return;
				}

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
	"use strict";
	
	chrome.windows.getAll(
	{ populate : true },
	function(windows) 
	{
		var i, aWindow, j, aTab;
		for(i = 0; i < windows.length; i++) 
		{
			aWindow = windows[i];
			for(j = 0; j < aWindow.tabs.length; j++) 
			{
				aTab = aWindow.tabs[j];
				if (matchDeezerUrl(aTab.url))
				{
					if (aTab.id !== iIgnoreTabId)
					{
						iCallback(aTab.id, aWindow.id);
						return;
					}
				}
			}
		}
		
		// no deezer tab found, pass null as arguments of the callback
		if (iCallback)
		{
			iCallback(null, null);
		}
	});
}


// set up the popup: if at least one deezer tab is opened, we'll show the popup
// otherwise, open a new deezer tab
function setUpPopup()
{
	"use strict";
	
	// extension has just been updated, show new items
	if (LOCSTO.newOptionsToShow)
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
	"use strict";
	
	if (iDeezerTabId === null)
	{
		LOCSTO.session.deezerData = null; // reset playing data
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
chrome.runtime.onMessage.addListener(extensionOnMessageListener);
function extensionOnMessageListener(request, sender, sendResponse) 
{
	"use strict";
	switch (request.type)
	{
	case "now_playing_updated":
		LOCSTO.session.deezerData = request.nowPlayingData;

		// update the button's tooltip only if no update should be shown
		if (!LOCSTO.newOptionsToShow)
		{
			updateButtonTooltip();
		}
		
		propagatePlayingDataToAllTabs();
		
		// reset the fact that action is on media key event
		gActionOnHotKey = false;
		gActionOnNotifButton = false;
		
		break;

	case "controlPlayer":
		gActionOnHotKey = request.source === 'hotkey';
		gActionOnNotifButton = request.source === 'notif';
		
		// send the wanted action to the deezer tab
		findDeezerTab(function(iDeezerTabId) 
		{
			chrome.tabs.sendMessage(iDeezerTabId, { name: request.type, action: request.command });
		});
		
		break;

	case "doAction":		
		findDeezerTab(function(iDeezerTabId, iDeezerWindowId) 
		{
			chrome.tabs.sendMessage(iDeezerTabId, { name: request.type, action: request.action });
			onFindDeezerTabForJumpToDeezer(iDeezerTabId, iDeezerWindowId);
		});
		
		break;
		
	case "showNotif":
		showNotif(true);
		break;
		
	case "jumpToDeezer":
		// find current active tab
		// if not deezer tab, jump to the deezer tab
		// if deezer tab, jump back to saved tab
		chrome.windows.getLastFocused(
		{ populate : true },
		function(window) 
		{
			// find the active tab
			var j;
			for(j = 0; j < window.tabs.length; j++) 
			{
				if (window.tabs[j].active)
				{
					// we're on the Deezer tab, go back to previous tab
					if (request.source !== 'notif' && matchDeezerUrl(window.tabs[j].url))
					{
						chrome.windows.update(LOCSTO.session.jumpBackToActiveTab.windowsId, { focused: true });
						chrome.tabs.update(LOCSTO.session.jumpBackToActiveTab.tabId, { selected: true });
					}
	
					// not on the Deezer tab, find it and set it to active
					else
					{
						findDeezerTab(onFindDeezerTabForJumpToDeezer);
					}
				}
			}
		});
		break;
		
	case "getLOCSTO":
		sendResponse(LOCSTO);
		return true;
		
	case "getDeezerData":
		sendResponse(LOCSTO.session.deezerData);
		return true;

	case "optionsChanged":
		LOCSTO.loadOptions();
		break;
		
	case "injectHotKeysJsOnAllTabs":
		chrome.windows.getAll(
		{ populate : true },
		function(windows) 
		{
			var i, aWindow, j, aTab;
			for(i = 0; i < windows.length; i++) 
			{
				aWindow = windows[i];
				for(j = 0; j < aWindow.tabs.length; j++) 
				{
					aTab = aWindow.tabs[j];
					
					// ignore all chrome internal urls
					if (aTab.url.lastIndexOf("chrome", 0) !== 0)
					{
						chrome.tabs.executeScript(aTab.id, { file: "/scripts/hotkeys.js", runAt: "document_start" });
					}
				}
			}
		});
		break;

	}
	
	return false;
}

function onFindDeezerTabForJumpToDeezer(iDeezerTabId, iDeezerWindowId) 
{
	"use strict";
	
	// we found a Deezer tab, switch to it
	if (iDeezerTabId === null || iDeezerWindowId === null)
		return;
	
	chrome.windows.update(iDeezerWindowId, { focused: true });
	chrome.tabs.update(iDeezerTabId, { selected: true });
}

function showNotif(iForceRedisplay)
{
	"use strict";
	
	// if no deezer data, close notif, otherwise show it
	if (LOCSTO.session.deezerData === null)
	{
		NOTIFS.destroyNotif();
	}
	// we have data to show
	else
	{
		// update or create notification
		if (LOCSTO.notifications.never)
		{
			NOTIFS.destroyNotif();
			return;
		}
		
		// force a full redisplay of the notifs
		var forceRedisplay =	 LOCSTO.notifications.onSongChange 
							 || (LOCSTO.notifications.onHotKeyOnly && gActionOnHotKey)
							 ||  gActionOnNotifButton
							 ||  iForceRedisplay === true;
		
		// if we don't have permission to display notifications, close notif if present
		chrome.permissions.contains({ permissions: ['notifications'] }, function(granted)
		{
			if (granted)
			{
				NOTIFS.createNotif(forceRedisplay);
			}
			else
			{
				NOTIFS.destroyNotif();
			}
		});
	}
}

function updateButtonTooltip()
{
	"use strict";
	
	if (LOCSTO.session.deezerData !== null)
	{
		chrome.browserAction.setTitle({ title: LOCSTO.session.deezerData.dz_track + ' - ' + LOCSTO.session.deezerData.dz_artist });
	}
	else
	{
		chrome.browserAction.setTitle({ title: '' });
	}
}

function cacheCover(size, albumId)
{
	var coverUrl = COVER.getCoverUrl(size, albumId);
	if (coverUrl === null)
	{
		return;
	}
	
	var img = new Image();
	img.src = coverUrl;
}

function propagatePlayingDataToAllTabs()
{
	"use strict";
	
	// refresh all opened popups, tabs (i.e. option page), and notifications
	chrome.extension.getViews({ type: 'tab' }).forEach(refreshPopupOnWindow);
	chrome.extension.getViews({ type: 'popup' }).forEach(refreshPopupOnWindow);
	
	// show / hide notif if needed
	showNotif();

	// precache covers
	if (LOCSTO.session.deezerData !== null)
	{		
		// cache notification images if needed
		if (!LOCSTO.notifications.never)
		{
			cacheCover(LOCSTO.coverSizeNotifs, LOCSTO.session.deezerData.dz_prev_cover);
			cacheCover(LOCSTO.coverSizeNotifs, LOCSTO.session.deezerData.dz_cover);
			cacheCover(LOCSTO.coverSizeNotifs, LOCSTO.session.deezerData.dz_next_cover);
		}
		
		// cache full images (might be the same size)
		cacheCover(LOCSTO.coverSize, LOCSTO.session.deezerData.dz_prev_cover);
		cacheCover(LOCSTO.coverSize, LOCSTO.session.deezerData.dz_cover);
		cacheCover(LOCSTO.coverSize, LOCSTO.session.deezerData.dz_next_cover);
	}
}

function refreshPopupOnWindow(win) 
{ 
	"use strict";
	win.refreshPopup(); 
}

function matchDeezerUrl(iUrl)
{
	"use strict";
	return new RegExp("^http[s]?:\/\/.*deezer\.com.*","gi").test(iUrl);
}
