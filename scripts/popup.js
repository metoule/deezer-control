
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
		{
			title = $(this).text();
		}
		
		$(this).attr('title', title);
	});
	
	// reset popup
	refreshPopup();
}

function loadStyle(iPopupStyle)
{
	"use strict";
	
	var aPopupStyle = iPopupStyle || LOCSTO.popupStyle;
	if (aPopupStyle !== null)
	{
		// set the style based on the preference
		if ($("#popup_style_css").length)
		{
			$("#popup_style_css").attr('href', 'css/' + aPopupStyle + '/popup.css');
		}
		
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
	"use strict";
	chrome.runtime.sendMessage({ type: "controlPlayer", command: iCommand, source: "popup" });
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
		console.log(aNowPlayingData);
		if (aNowPlayingData !== null)
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
