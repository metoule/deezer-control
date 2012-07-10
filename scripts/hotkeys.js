

window.removeEventListener('keydown', keyboardNavigation, false);
window.addEventListener('keydown', keyboardNavigation, false);

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
	}); 
}

function eventMatchHotKey(e, iHotKey)
{
	return e.shiftKey == iHotKey.shiftKey && e.altKey == iHotKey.altKey && e.ctrlKey == iHotKey.ctrlKey && e.keyCode == iHotKey.keyCode;		
}