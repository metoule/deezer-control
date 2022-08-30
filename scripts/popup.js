
window.addEventListener('load', function(/*e*/) 
{
	"use strict";
	jQueryExtension();
	preparePopup(); 
});

function preparePopup()
{
	"use strict";
	loadStyle();

	// add interactivity
	$("#control-prev").click(function ()  { executePlayerAction('previoustrack');  return false; });
	$("#control-pause").click(function () { executePlayerAction('pause'); return false; });
	$("#control-play").click(function ()  { executePlayerAction('play');  return false; });
	$("#control-next").click(function ()  { executePlayerAction('nexttrack');  return false; });
	$("#control-like").click(function ()  { executePlayerAction('like');  return false; });
	$('#now_playing_info_track').click(function ()  { executeDoAction('linkCurrentSong');   return false; });
	$('#now_playing_info_artist').click(function () { executeDoAction('linkCurrentArtist'); return false; });
	
	// add tooltip in case of ellipsis (onmouseover to force recompute in the event of style change)
	$('#now_playing_info > span').mouseover(function () 
	{
		var title = '';
		if (this.offsetWidth < this.scrollWidth)
		{
			title = $(this).text();
		}
		
		$(this).attr('title', title);
	});
	
	// reset popup
	setTimeout(refreshPopup, 0);
}

function loadStyle(iPopupStyle)
{
	"use strict";
	
	var aPopupStyle = iPopupStyle || LOCSTO.popupStyle, 
	    aPopupCss   = $("#popup_style_css");
	if (aPopupStyle !== null && aPopupCss.length)
	{
		aPopupCss.attr('href', 'css/' + aPopupStyle + '/popup.css');
	}
}


function executePlayerAction(iCommand)
{
	"use strict";
	chrome.runtime.sendMessage({ type: "controlPlayer", command: iCommand, source: "popup" });
	return false;
}

// change focus to Deezer tab, and execute wanted action
function executeDoAction(iAction)
{
	"use strict";
	chrome.runtime.sendMessage({ type: "doAction", action: iAction });
}

function refreshPopup()
{
	"use strict";
	
	// get now playing info from background page
	chrome.runtime.sendMessage({ type: "getDeezerData" }, function(aNowPlayingData) 
	{ 
		if (aNowPlayingData !== null)
		{
			// is song liked?
			var isLiked = aNowPlayingData.dz_is_liked === 'true';
			$('#control-like').toggleClass('not_liked', !isLiked).toggleClass('is_liked', isLiked);
			
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
	
			// get the cover
			$('#cover').attr('src', aNowPlayingData.dz_cover);
		} 
		else 
		{
			$('#now_playing_info').hide();
			$('#control-pause').hide();
			$('#control-like').removeClass('is_liked').addClass('not_liked');
			$('#cover').attr('src', "imgs/unknown_cd.png");
		}
	});
}

function jQueryExtension()
{
	"use strict";
	$.fn.extend({
		visibilityToggle: function(showOrHide)
		{
			return this.css('visibility', showOrHide === true ? 'visible' : 'hidden');
		}
	});
}
