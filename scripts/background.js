
var gActionOnHotKey = false; // this boolean will be used to show the notifs only on hotkey event
var gActionOnNotifButton = false; // this boolean will be used to show the notifs on notifs button click

// when the event page goes to sleep, remember session
chrome.runtime.onSuspend.addListener(function() { LOCSTO.saveSession(); });

// install, update, or chrome update
chrome.runtime.onInstalled.addListener(function(details)
{
	"use strict";

	// inject content script on player tabs
	if (details.reason === "install" || details.reason === "update")
	{
		// insert expected scripts on all pages matching the patterns in the manifest
		var content_scripts = chrome.runtime.getManifest().content_scripts;
		for (var i = 0; i < content_scripts.length; i++)
		{
			var content_script = content_scripts[i];
			chrome.tabs.query({ url: content_script.matches[0] }, function(tabs)
			{
				var js_to_inject = content_script.js; 
				for (var j = 0; j < tabs.length; j++) 
				{
					for (var k = 0; k < js_to_inject.length; k++)
					{
						chrome.tabs.executeScript(tabs[j].id, { file: js_to_inject[k] });
					}
				}
			});
		}
		
		// re-inject hotkeys on all opened tabs
		chrome.permissions.contains({ origins: [ "<all_urls>" ] }, function(granted) 
		{
			if (granted)
			{
				extensionOnMessageListener({ type: 'injectHotKeysJsOnAllTabs' });
			}
		});
	
		// update local storage if needed
		LOCSTO.updateModel();
	}
});

// if no popup is set, it means that we should open a new tab with default player
chrome.browserAction.onClicked.addListener(function() 
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
		
		propagatePlayingDataToAllTabs();
	}
	// else: normal use case
	else 
	{
		// TODO add default player
		chrome.tabs.create({ url: 'http://www.deezer.com' });
	}
});

// inject hotkeys.js on any page if user allowed it
chrome.webNavigation.onCommitted.addListener(function(data) 
{
	"use strict";
	
	// ignore sub frames and chrome urls
	if (data.frameId !== 0 || data.url.lastIndexOf("chrome", 0) === 0)
	{
		return;
	}

	chrome.permissions.contains({ origins: [ "<all_urls>" ] }, function(granted) 
	{
		if (granted)
		{
			chrome.tabs.executeScript(data.tabId, { file: "/scripts/hotkeys.js", runAt: "document_start" });
		}
	});

	// recount number of opened player tabs
	setUpPopup();
});

// remove closing tab id from players tabs
chrome.tabs.onRemoved.addListener(function(tabId)
{
	var index = LOCSTO.session.playersTabs.indexOf(tabId);
	if (index > -1)
	{
		LOCSTO.session.playersTabs.splice(index, 1);

		// current player is closed, move to the next and resume playing
		if (index === 0 && LOCSTO.session.playersTabs.length > 0)
		{
			var isPlaying = LOCSTO.session.deezerData.dz_playing;
			if (isPlaying === 'true')
				extensionOnMessageListener({ type: "controlPlayer", command: "play" });
			LOCSTO.session.deezerData = LOCSTO.session.playersData[LOCSTO.session.playersTabs[0]];
			LOCSTO.session.deezerData.dz_playing = isPlaying;
			propagatePlayingDataToAllTabs();
		}
	}
	
	if (LOCSTO.session.playersData.hasOwnProperty(tabId))
		delete LOCSTO.session.playersData[tabId];

	// recount number of opened player tabs
	setUpPopup();
});

// save active tab any time it changes to be able to go back to it 
chrome.tabs.onActivated.addListener(function (iActiveTabInfo) 
{
	"use strict";
	chrome.tabs.get(iActiveTabInfo.tabId, function(aActiveTab)
	{
		if (!aActiveTab)
		{
			return;
		}
		
		// ignore active tab if current active player: we don't want to go back to it!
		if (LOCSTO.session.playersTabs.indexOf(aActiveTab.id) !== 0)
		{
			LOCSTO.session.jumpBackToActiveTab.windowId = aActiveTab.windowId;
			LOCSTO.session.jumpBackToActiveTab.tabId = aActiveTab.id;
		}
	});
});


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
	else if (LOCSTO.session.playersTabs.length == 0)
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
		// player has just been loaded
		var playerTabId = sender.tab.id;
		if (LOCSTO.session.playersTabs.indexOf(playerTabId) === -1)
		{
			// check limit one page per player
			if (LOCSTO.miscOptions.limitDeezerToOneTab === true)
			{
				for(var key in LOCSTO.session.playersData)
				{
					if (request.nowPlayingData.name === LOCSTO.session.playersData[key].name)
					{
						// close opening tab
						chrome.tabs.remove(playerTabId);
						
						// move to already opened tab
						jumpToTab(parseInt(key, 10));
						return false;
					}
				}
			}
			
			LOCSTO.session.playersTabs.push(playerTabId);
		}
		
		// update player info
		LOCSTO.session.playersData[playerTabId] = request.nowPlayingData;
		
		// change of player?
		if (playerTabId !== LOCSTO.session.playersTabs[0])
		{
			// current player is not playing / new player is playing
			if (LOCSTO.session.deezerData.dz_playing !== 'true' || request.nowPlayingData.dz_playing === 'true')
			{
				// stops current player
				extensionOnMessageListener({ type: "controlPlayer", command: "pause" });
				
				// reorder tabs order
				var index = LOCSTO.session.playersTabs.indexOf(playerTabId);
				LOCSTO.session.playersTabs.splice(index, 1);
				LOCSTO.session.playersTabs.splice(0, 0, playerTabId);
				
				LOCSTO.session.deezerData = request.nowPlayingData;
			}
		}
		else
		{
			// same player
			LOCSTO.session.deezerData = request.nowPlayingData;
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
		if (LOCSTO.session.playersTabs.length > 0)
			chrome.tabs.sendMessage(LOCSTO.session.playersTabs[0], { name: request.type, action: request.command });
		break;

	case "doAction":
		if (LOCSTO.session.playersTabs.length > 0)
		{
			chrome.tabs.sendMessage(LOCSTO.session.playersTabs[0], { name: request.type, action: request.action });
			jumpToTab(LOCSTO.session.playersTabs[0]);
		}
		break;
		
	case "showNotif":
		showNotif(true);
		break;
		
	case "jumpToDeezer":
		// find current active tab
		// if not deezer tab, jump to the deezer tab
		// if deezer tab, jump back to saved tab
		if (LOCSTO.session.playersTabs.length > 0)
		{
			chrome.tabs.query({ currentWindow: true, active: true }, function (tabs)
			{
				// we're on the Deezer tab, go back to previous tab
				if (tabs[0].id === LOCSTO.session.playersTabs[0])
				{
					chrome.windows.update(LOCSTO.session.jumpBackToActiveTab.windowId, { focused: true });
					chrome.tabs.update(LOCSTO.session.jumpBackToActiveTab.tabId, { selected: true });
				}
				// not on the Deezer tab, find it and set it to active
				else
				{
					jumpToTab(LOCSTO.session.playersTabs[0]);
				}
			});
		}
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

function jumpToTab(iTabId)
{
	chrome.tabs.get(iTabId, function(tab) 
	{
		chrome.windows.update(tab.windowId, { focused: true });
		chrome.tabs.update(tab.id, { selected: true });	
	});
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

function propagatePlayingDataToAllTabs()
{
	"use strict";
	
	// refresh all opened popups, tabs (i.e. option page), and notifications
	chrome.extension.getViews({ type: 'tab' }).forEach(refreshPopupOnWindow);
	chrome.extension.getViews({ type: 'popup' }).forEach(refreshPopupOnWindow);
	
	// show / hide notif if needed
	showNotif();

	// update the button's tooltip only if no update should be shown
	if (!LOCSTO.newOptionsToShow)
	{
		var newTitle = '';
		if (LOCSTO.session.deezerData !== null)
			newTitle = LOCSTO.session.deezerData.dz_track + ' - ' + LOCSTO.session.deezerData.dz_artist;
		chrome.browserAction.setTitle({ title: newTitle });
	}

	// precache covers
	if (LOCSTO.session.deezerData !== null)
	{
		new Image().src = LOCSTO.session.deezerData.dz_prev_cover;
		new Image().src = LOCSTO.session.deezerData.dz_cover;
		new Image().src = LOCSTO.session.deezerData.dz_next_cover;
	}
}

function refreshPopupOnWindow(win) 
{ 
	"use strict";
	win.refreshPopup(); 
}

// actions to perform when the event page is loaded
(function()
{
	"use strict";
	console.log("On load ?");
	setUpPopup();

	// clean up current players queue
	var len = LOCSTO.session.playersTabs.length, 
		tabId;
	
	while(len--)
	{
		tabId = LOCSTO.session.playersTabs[len];
		try
		{
			chrome.tabs.get(tabId, function() {})
		} 
		catch(e)
		{
			LOCSTO.session.playersTabs.splice(len, 1);
			if (LOCSTO.session.playersData.hasOwnProperty(tabId))
				delete LOCSTO.session.playersData[tabId];
		}
	}
	
	LOCSTO.saveSession();
})();
