
function executePlayerAction(iCommand)
{
	executeActionOnDeezerTab("controlPlayer", iCommand, function() 
	{
		var aNowPlayingData = chrome.extension.getBackgroundPage().gNowPlayingData;
		if (aNowPlayingData == null) return;
		if (iCommand == 'play')
			aNowPlayingData.dz_playing = 'true';
		else if (iCommand == 'pause')
			aNowPlayingData.dz_playing = 'false';
		refreshPopup();
	});
}

function executeActionOnDeezerTab(iName, iAction, iCallback)
{
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
						chrome.tabs.sendRequest(aDeezerTabId, {name: iName, action: iAction}, function(response) { if (iCallback) iCallback(); });
					}
				}
			}
		});	
}

function refreshPopup()
{
	// get now playing info from background page
	var aNowPlayingData = chrome.extension.getBackgroundPage().gNowPlayingData;
	if (aNowPlayingData != null)
	{
		document.getElementById('now_playing_info').style.visibility = "visible";
		
		if (aNowPlayingData.dz_playing == 'true')
		{
			document.getElementById('control-pause').style.display = "inline";
			document.getElementById('control-play').style.display  = "none";
		} else {
			document.getElementById('control-pause').style.display = "none";
			document.getElementById('control-play').style.display  = "inline";
		}
		
		// set track title and artist
		document.getElementById('now_playing_info_track').innerHTML = aNowPlayingData.dz_track;
		document.getElementById('now_playing_info_artist').innerHTML = aNowPlayingData.dz_artist;
		
		// get the cover (other available sizes are 70x70 and 315x315)
		document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + aNowPlayingData.dz_cover + "/120x120-000000-80-0-0.jpg";
	} else {
		document.getElementById('control-pause').style.display = "none";
		document.getElementById('now_playing_info').style.visibility = "hidden";
		document.getElementById('cover').src = "imgs/logo_deezer.png";
	}
}
