

function eventMatchHotKey(e, iHotKey)
{
	"use strict";
	// TODO use === for key code (requires to update the saved preferences: e.keyCode is an integer, iHotKey.keyCode is a string)
	return e.shiftKey === iHotKey.shiftKey && e.altKey === iHotKey.altKey && e.ctrlKey === iHotKey.ctrlKey && e.keyCode == iHotKey.keyCode;
}

function keyboardNavigation(e) 
{
	"use strict";
	chrome.runtime.sendMessage({ type: "getLOCSTO" }, function(LOCSTO) 
	{ 
		if (eventMatchHotKey(e, LOCSTO.prevHotKey))
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: "prev", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.playPauseHotKey))
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: "playpause", source: "hotkey" });
		} 
		else if (eventMatchHotKey(e, LOCSTO.nextHotKey))
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: "next", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.whatZatSongHotKey))
		{
			chrome.runtime.sendMessage({ type: "showNotif", source: "hotkey" });
		}
		else if (eventMatchHotKey(e, LOCSTO.jumpToDeezerHotKey))
		{
			chrome.runtime.sendMessage({ type: "jumpToDeezer", source: "hotkey" });
		}
	}); 
}

window.addEventListener("keydown", keyboardNavigation, false);