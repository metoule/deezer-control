
var HOTKEYS_LISTENER = HOTKEYS_LISTENER || {
	
	register: function()
	{
		if (!this.isRegistered)
		{
			window.addEventListener('keydown', keyboardNavigation, false);
			this.isRegistered = true;
		}
	}
	
};
HOTKEYS_LISTENER.register();

function keyboardNavigation(e) 
{
	chrome.extension.sendRequest({ type: "getLOCSTO" }, function(LOCSTO) 
	{ 
		if (eventMatchHotKey(e, LOCSTO.prevHotKey))
		{
			chrome.extension.sendRequest({ type: "controlPlayer", command: "prev", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.playPauseHotKey))
		{
			chrome.extension.sendRequest({ type: "controlPlayer", command: "playpause", source: "hotkey" });
		} 
		else if (eventMatchHotKey(e, LOCSTO.nextHotKey))
		{
			chrome.extension.sendRequest({ type: "controlPlayer", command: "next", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.whatZatSongHotKey))
		{
			chrome.extension.sendRequest({ type: "showNotif", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.jumpToDeezerHotKey))
		{
			chrome.extension.sendRequest({ type: "jumpToDeezer", source: "hotkey" });
		}
	}); 
}

function eventMatchHotKey(e, iHotKey)
{
	return e.shiftKey == iHotKey.shiftKey && e.altKey == iHotKey.altKey && e.ctrlKey == iHotKey.ctrlKey && e.keyCode == iHotKey.keyCode;
}