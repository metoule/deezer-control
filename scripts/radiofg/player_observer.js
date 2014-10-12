

function GetCover(src)
{
	if (src !== undefined && src.charAt(0) === '/')
		return window.location.origin + src;
	return src;
}

// get data from JS object dzPlayer
function updateDeezerControlData()
{
	"use strict";
	var DeezerControlData = document.getElementById('DeezerControlData');
	
	DeezerControlData.setAttribute('dz_is_active',   true);
	DeezerControlData.setAttribute('dz_playing',	 $('#playBtn').css('display') === 'none');
	DeezerControlData.setAttribute('dz_artist',	     $("#artistSong").text().trim());
	DeezerControlData.setAttribute('dz_track',	     $("#titleSong").text().trim());
	DeezerControlData.setAttribute('dz_is_liked',	 $(".voteaction i").hasClass("icon-heart"));
	DeezerControlData.setAttribute('dz_cover',	     GetCover($('#coverimg').attr("src")));
	DeezerControlData.setAttribute('dz_is_prev_active', false);
	DeezerControlData.setAttribute('dz_is_next_active', false);
	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime()); 
}

function deezerControlMethod_pause()
{
	"use strict";
	$("#stopBtn").click();
}

function deezerControlMethod_play()
{
	"use strict";
	$("#playBtn").click();
}

function deezerControlMethod_prev()
{
	"use strict";
	// NOP
}

function deezerControlMethod_next()
{
	"use strict";
	// NOP
}

function deezerControlMethod_like()
{
	"use strict";
	$(".voteaction").click();
}

function deezerControlMethod_linkCurrentSong()
{
	"use strict";
	// NOP
}

function deezerControlMethod_linkCurrentArtist()
{
	"use strict";
	// NOP
}

//trigger the observer on removeMe
function triggerRemoveDeezerData()
{
	document.getElementById('removeMe').textContent = "now"; 
}

// update content on first load
(function()
{
	"use strict";
	
	var player_track_title = $("#artistSong, #titleSong");
	var player_control_play = $("#playBtn");
	
	// ensure the player is on the page
	if (player_track_title.length > 0 && player_control_play.length > 0)
	{
		// observe the changes of style atttribute of #player_control_play, to track play / pause changes
		// (its style changes from hidden to display)
		// observe the changes of content of #player_track_title, to track song changes
		var observerPlay = new MutationObserver(function(mutations) 
		{
			"use strict";
			
			var bUpdateInfo = false, i, mutation;
			for (i = 0; i < mutations.length && !bUpdateInfo; i++)
			{
				mutation = mutations[i];
				
				// result of 'player_control_play' observer
				if (mutation.type === "attributes")
				{
					bUpdateInfo  = mutation.oldValue !== mutation.target.getAttribute(mutation.attributeName);
				}
				// result of 'player_track_title' observer
				else if (mutation.type === "characterData" || mutation.type === "childList")
				{
					bUpdateInfo = true;
				}
			}

			if (bUpdateInfo)
			{
				updateDeezerControlData();
			}
		});
		
		player_track_title.each(function ()  { observerPlay.observe(this, { childList: true, characterData: true }); });
		player_control_play.each(function () { observerPlay.observe(this, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] }); });

		// needed for like (the like button is added via jQuery on song change..)
		$("#titleSong").each(function () { observerPlay.observe(this, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] }); });;
		
		updateDeezerControlData();
	}
	// failure to initialize
	else 
		triggerRemoveDeezerData();
})();
