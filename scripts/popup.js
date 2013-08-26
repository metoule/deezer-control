
window.addEventListener('load', function(e) { preparePopup(); });

function gup(iParamName)
{
	// taken from http://www.netlobo.com/url_query_string_javascript.html
	var aParamName = iParamName.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");  
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
	$('#now_playing_info_track').click(function ()  { executeDoAction('linkCurrentSong');   return false; });
	$('#now_playing_info_artist').click(function () { executeDoAction('linkCurrentArtist'); return false; });
	
	// add tooltip in case of ellipsis
	$('#now_playing_info > span').on('mouseenter', function () 
	{
		if (this.offsetWidth < this.scrollWidth && !$(this).attr('title'))
			$(this).attr('title', $(this).text()); 
	});
	
	// reset popup
	setTimeout(refreshPopup, 0);
	
	// we're in a notif scenario, add mouse over and mouse out
	if (gup('notif') == 'on')
	{		
		window.addEventListener('mouseover', function(e) 
				{ 
					chrome.extension.getBackgroundPage().NOTIFS.onMouseOverNotif();
					return true; 
				});
		window.addEventListener('mouseout',  function(e) 
				{ 
					chrome.extension.getBackgroundPage().NOTIFS.onMouseOutNotif();
					return true; 
				});
	}
}

function loadStyle(iPopupStyle)
{
	var aPopupStyle = iPopupStyle;
	if (aPopupStyle == null)
		aPopupStyle = gup('style'); // grep url param (used to force a style when creating a notification in background.js)

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
		COVER_SIZE = COVER_SIZES[aPopupStyle];
		
		// replace img src to show new size
		document.getElementById('cover').src = document.getElementById('cover').src.replace(aOldSize, COVER_SIZE);
	}
}


function executePlayerAction(iCommand)
{
	chrome.runtime.sendMessage({ type: "controlPlayer", command: iCommand, source: "popup" });
}

// change focus to Deezer tab, and execute wanted action
function executeDoAction(iAction)
{
	chrome.runtime.sendMessage({ type: "doAction", action: iAction });
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
		$('#now_playing_info_track').text(aNowPlayingData.dz_track);
		$('#now_playing_info_artist').text(aNowPlayingData.dz_artist);
		
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
