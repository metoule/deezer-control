
var COVER_SIZE_LARGE = "250x250";
var COVER_SIZE_SMALL = "120x120";
var COVER_SIZE_SIDEWAYS = "80x80";

var COVER_SIZE = COVER_SIZE_LARGE;

window.addEventListener('load', function(e) { preparePopup(); });
window.addEventListener('unload', function(e) { if (gup('notif') == 'on') chrome.extension.getBackgroundPage().closeNotif(); });

function gup(iParamName)
{
	// taken from http://www.netlobo.com/url_query_string_javascript.html
	var aParamName = iParamName.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
	var regexS = "[\\?&]" + aParamName + "=([^&#]*)";  
	var regex = new RegExp(regexS);  
	var results = regex.exec(window.location.href); 
	if (results == null)
		return null;  
	else
		return results[1];
}

function preparePopup()
{
	loadStyle();

	// add interactivity
	$("#control-prev").click(function ()  { executePlayerAction('prev');  return false; });
	$("#control-pause").click(function () { executePlayerAction('pause'); return false; });
	$("#control-play").click(function ()  { executePlayerAction('play');  return false; });
	$("#control-next").click(function ()  { executePlayerAction('next');  return false; });
	
	setTimeout(refreshPopup, 0);
	
	// we're in a notif scenario, add mouse over and mouse out
	if (gup('notif') == 'on')
	{		
		window.addEventListener('mouseover', function(e) { chrome.extension.getBackgroundPage().gMouseOverNotif = true;  chrome.extension.getBackgroundPage().resetNotifTimeout(); return true; });
		window.addEventListener('mouseout',  function(e) { chrome.extension.getBackgroundPage().gMouseOverNotif = false; chrome.extension.getBackgroundPage().startNotifTimeout(); return true; });
	}
}

function loadStyle(iPopupStyle)
{
	var aPopupStyle = iPopupStyle;
	if (aPopupStyle == null)
		aPopupStyle = gup('style'); // grep url param (used to force a style for when creating a notification in background.js)

	if (aPopupStyle == null)
		aPopupStyle = LOCSTO.popupStyle;
	
	if (aPopupStyle)
	{
		// set the style based on the preference
		if (document.getElementById("popup_style_css") != null)
			document.getElementById("popup_style_css").href = "css/" + aPopupStyle + "/popup.css";

		// on resize, we want to fetch the new cover to avoid pixelisation 
		// on size change from small to large
		var aOldSize = COVER_SIZE;
		
		// set the size of the cover 
		if (aPopupStyle == 'large') COVER_SIZE = COVER_SIZE_LARGE;
		else if (aPopupStyle == 'small') COVER_SIZE = COVER_SIZE_SMALL;
		else if (aPopupStyle == 'sideways') COVER_SIZE = COVER_SIZE_SIDEWAYS;
		
		// replace img src to show new size
		document.getElementById('cover').src = document.getElementById('cover').src.replace(aOldSize, COVER_SIZE);
	}
}


function executePlayerAction(iCommand)
{
	chrome.extension.sendRequest({ type: "controlPlayer", command: iCommand, source: "popup" }, function() 
	{
		// this trick is used to display the correct play / pause button 
		// when the user press it in the popup
		var aNowPlayingData = chrome.extension.getBackgroundPage().gNowPlayingData;
		if (aNowPlayingData == null) return;
		if (iCommand == 'play')
			aNowPlayingData.dz_playing = 'true';
		else if (iCommand == 'pause')
			aNowPlayingData.dz_playing = 'false';
		else if (iCommand == 'playpause')
		{
			if (aNowPlayingData.dz_playing == 'true')
				aNowPlayingData.dz_playing = 'false';
			else 
				aNowPlayingData.dz_playing = 'true';
		}
		refreshPopup();
	});
}

function refreshPopup()
{
	// get now playing info from background page
	var aNowPlayingData = chrome.extension.getBackgroundPage().gNowPlayingData;
	if (aNowPlayingData != null)
	{
		document.getElementById('now_playing_info').style.visibility = "visible";
		
		// show pause or play button 
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
		
		// show or hide prev / next buttons if needed
		document.getElementById('control-prev').style.visibility = (aNowPlayingData.dz_is_prev_active == 'true' ? "visible" : "hidden");
		document.getElementById('control-next').style.visibility = (aNowPlayingData.dz_is_next_active == 'true' ? "visible" : "hidden");
		
		// get the cover (can be ANY SIZE WE WANT :))
		document.getElementById('cover').src = "http://cdn-images.deezer.com/images/cover/" + aNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg";
	} else {
		document.getElementById('control-pause').style.display = "none";
		document.getElementById('now_playing_info').style.visibility = "hidden";
		document.getElementById('cover').src = "imgs/unknown_cd.png";
	}
}
