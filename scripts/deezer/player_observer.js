
function GetCoverFromAlbumId(albumId)
{
	"use strict";
	if (albumId === undefined || albumId === null)
		albumId = "";
	
	return "http://cdn-images.deezer.com/images/cover/" + albumId + "/250x250-000000-80-0-0.jpg";
}

// get data from JS object dzPlayer
function updateDeezerControlData()
{
	"use strict";
	var DeezerControlData = document.getElementById('DeezerControlData');
	var dzCurrentSong = { ART_ID: '', ALB_ID: '' };
	var dzPrevSong = { ALB_PICTURE: '' };
	var dzNextSong = { ALB_PICTURE: '' };
	
	try 
	{
		dzCurrentSong = dzPlayer.getCurrentSong() || { ART_ID: '', ALB_ID: '' };;
	} catch(e) {}

	try 
	{
		dzPrevSong = dzPlayer.getPrevSong() || { ALB_PICTURE: '' };
	} catch(e) {}

	try 
	{
		dzNextSong = dzPlayer.getNextSong() || { ALB_PICTURE: '' };
	} catch(e) {}
	
	DeezerControlData.setAttribute('dz_playing',	 document.getElementById('player_control_play').style.display === 'none');
	DeezerControlData.setAttribute('dz_artist',	     dzPlayer.getArtistName());
	DeezerControlData.setAttribute('dz_track',	     dzPlayer.getSongTitle());
	DeezerControlData.setAttribute('dz_cover',	     GetCoverFromAlbumId(dzPlayer.getCover()));
	DeezerControlData.setAttribute('dz_artist_id',   dzCurrentSong.ART_ID);
	DeezerControlData.setAttribute('dz_prev_cover',  GetCoverFromAlbumId(dzPrevSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_next_cover',  GetCoverFromAlbumId(dzNextSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_is_prev_active',   playercontrol.prevButtonActive());
	DeezerControlData.setAttribute('dz_is_next_active',   playercontrol.nextButtonActive());
	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime()); 
} 


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
observerPlay.observe(document.getElementById('player_track_title'),  { childList: true, characterData: true });  
observerPlay.observe(document.getElementById("player_control_play"), { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });

// process actions
function executeAction(action)
{
	"use strict";
	if (typeof(playercontrol) != 'undefined') 
		playercontrol.doAction(action);
}

function deezerControlMethod_pause()
{
	"use strict";
	executeAction('pause');
}

function deezerControlMethod_play()
{
	"use strict";
	executeAction('play');
}

function deezerControlMethod_prev()
{
	"use strict";
	executeAction('prev');
}

function deezerControlMethod_next()
{
	"use strict";
	executeAction('next');
}

function deezerControlMethod_linkCurrentSong()
{
	"use strict";
	executeAction('linkCurrentSong');
}

function deezerControlMethod_linkCurrentArtist()
{
	"use strict";
	loadBox('artist/' + document.getElementById('DeezerControlData').getAttribute('dz_artist_id'));
}

// update content on first load
updateDeezerControlData();
