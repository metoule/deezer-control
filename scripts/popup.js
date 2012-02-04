
var COVER_SIZE = "120x120";

function loadStyle(iPopupStyle)
{
	var aPopupStyle = iPopupStyle;
	if (aPopupStyle == null)
		aPopupStyle = localStorage["popup_style"];
	if (aPopupStyle)
	{
		// set the style based on the preference
		document.getElementById("popup_style_css").href = "css/" + aPopupStyle + "/popup.css";

		// set the size of the cover
		if (aPopupStyle == 'small') COVER_SIZE = "120x120"; 
		else if (aPopupStyle =='large') COVER_SIZE = "250x250";
	}
}


function executePlayerAction(iCommand)
{
	executeActionOnDeezerTab("controlPlayer", iCommand, function() 
	{
		// this trick is used to display the correct play / pause button 
		// when the user press it in the popup
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
			document.getElementById('control-pause').style.display = "inline-block";
			document.getElementById('control-play').style.display  = "none";
		} else {
			document.getElementById('control-pause').style.display = "none";
			document.getElementById('control-play').style.display  = "inline-block";
		}
		
		// set track title and artist
		document.getElementById('now_playing_info_track').innerHTML = aNowPlayingData.dz_track;
		document.getElementById('now_playing_info_artist').innerHTML = aNowPlayingData.dz_artist;
		//document.getElementById('now_playing_info_album').innerHTML = aNowPlayingData.dz_album;
		
		// get the cover (can be ANY SIZE YOU WANT :))
		document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + aNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
	} else {
		document.getElementById('control-pause').style.display = "none";
		document.getElementById('now_playing_info').style.visibility = "hidden";
		document.getElementById('cover').src = "imgs/logo_deezer.png";
	}
}
