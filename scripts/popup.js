
window.addEventListener('load', function(e) 
{
	jQueryExtension();
	preparePopup(); 
});

// get url parameters
function gup(iParamName)
{
	// taken from http://www.netlobo.com/url_query_string_javascript.html
	var aParamName = iParamName.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]"),  
		regexS = "[\\?&]" + aParamName + "=([^&#]*)",
		regex = new RegExp(regexS),
		results = regex.exec(window.location.href);
	
	if (results === null)
		return null;

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
	
	// add tooltip in case of ellipsis (onmouseover to force recompute in the event of style change)
	$('#now_playing_info > span').mouseover(function () 
	{
		var title = '';
		if (this.offsetWidth < this.scrollWidth)
			title = $(this).text();
		$(this).attr('title', title);
	});
	
	// reset popup
	refreshPopup();
	
	// we're in a notif scenario, add mouse over and mouse out
	if (gup('notif') === 'on')
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
		if ($("#popup_style_css").length)
			$("#popup_style_css").attr('href', 'css/' + aPopupStyle + '/popup.css');

		// on resize, we want to fetch the new cover to avoid pixelisation 
		// on size change from small to large
		var aOldSize = COVER_SIZE;
		
		// set the size of the cover 
		COVER_SIZE = COVER_SIZES[aPopupStyle];
		
		// replace img src to show new size
		$('#cover').attr('src', function(index, oldSrc) { return oldSrc.replace(aOldSize, COVER_SIZE); });
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
		// show pause or play button 
		var showPause = aNowPlayingData.dz_playing === 'true';
		$('#control-play').css('display', 'inline-block').toggle(!showPause);
		$('#control-pause').css('display', 'inline-block').toggle(showPause);
		
		// set track title and artist
		$('#now_playing_info').show();
		$('#now_playing_info_track').text(aNowPlayingData.dz_track);
		$('#now_playing_info_artist').text(aNowPlayingData.dz_artist);
		
		// show or hide prev / next buttons if needed
		$('#control-prev').visibilityToggle(aNowPlayingData.dz_is_prev_active === 'true');
		$('#control-next').visibilityToggle(aNowPlayingData.dz_is_next_active === 'true');

		// get the cover (can be ANY SIZE WE WANT :))
		$('#cover').attr('src', "http://cdn-images.deezer.com/images/cover/" + aNowPlayingData.dz_cover + "/" + COVER_SIZE + "-000000-80-0-0.jpg");
	} 
	else 
	{
		$('#now_playing_info').hide();
		$('#control-pause').hide();
		$('#cover').attr('src', "imgs/unknown_cd.png");
	}
}

function jQueryExtension()
{
	$.fn.extend({
		visibilityToggle: function(showOrHide)
		{
			return this.css('visibility', showOrHide === true ? 'visible' : 'hidden');
		}
	});
}
