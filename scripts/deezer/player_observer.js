
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
	var DeezerControlData = document.getElementById('DeezerControlData'),
		dzCurrentSong, dzPrevSong, dzNextSong,
		isPlaying = true,
		isPrevActive = dzPlayer.getPrevSong() !== null, 
		isNextActive = dzPlayer.getNextSong() !== null;
	
	try 
	{
		dzCurrentSong = dzPlayer.getCurrentSong() || { ALB_PICTURE: '', ART_ID: '', ALB_ID: '' };;
	} catch(e) {}

	try 
	{
		dzPrevSong = dzPlayer.getPrevSong() || { ALB_PICTURE: '' };
	} catch(e) {}

	try 
	{
		dzNextSong = dzPlayer.getNextSong() || { ALB_PICTURE: '' };
	} catch(e) {}
	
	isPlaying = dzPlayer.isPlaying();
	
	DeezerControlData.setAttribute('dz_is_active',   true);
	DeezerControlData.setAttribute('dz_playing',	 isPlaying);
	DeezerControlData.setAttribute('dz_artist',	     dzPlayer.getArtistName());
	DeezerControlData.setAttribute('dz_track',	     dzPlayer.getSongTitle());
	DeezerControlData.setAttribute('dz_is_liked',	 userData.isFavorite('song', dzCurrentSong.SNG_ID));
	DeezerControlData.setAttribute('dz_artist_id',   dzCurrentSong.ART_ID);
	DeezerControlData.setAttribute('dz_album_id',    dzCurrentSong.ALB_ID);
	DeezerControlData.setAttribute('dz_cover',	     GetCoverFromAlbumId(dzCurrentSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_prev_cover',  GetCoverFromAlbumId(dzPrevSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_next_cover',  GetCoverFromAlbumId(dzNextSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_is_prev_active', isPrevActive);
	DeezerControlData.setAttribute('dz_is_next_active', isNextActive);
	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime()); 
}

// process actions
function executeAction(action)
{
	"use strict";
	if (dzPlayer === undefined || dzPlayer.control === undefined) 
		return;
	
	switch (action) 
	{
		case 'pause':
			dzPlayer.control.pause();
			break;
		case 'play':
			dzPlayer.control.play();
			break;
		case 'prev':
			dzPlayer.control.prevSong();
			break;
		case 'next':
			dzPlayer.control.nextSong();
			break;
	}
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
	executeAction("prev");
}

function deezerControlMethod_next()
{
	"use strict";
	executeAction("next");
}

function deezerControlMethod_like()
{
	"use strict";
	var songId = dzPlayer.getCurrentSong('SNG_ID'),
		data = { type: 'song', id: songId };
	
	if (userData.isFavorite('song', songId))
		favorite.remove(data);
	else
		favorite.add(data);
}

function deezerControlMethod_linkCurrentSong()
{
	"use strict";
	loadBox('album/' + document.getElementById('DeezerControlData').getAttribute('dz_album_id'));
}

function deezerControlMethod_linkCurrentArtist()
{
	"use strict";
	loadBox('artist/' + document.getElementById('DeezerControlData').getAttribute('dz_artist_id'));
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
		
	// ensure the player is on the page
	if (dzPlayer !== null)
	{
		var player_track_title = $(".player-track-title a");
		var player_control_play = $(".control-play");
		
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
		
		player_track_title.each(function ()  { observerPlay.observe(this, { childList: true, characterData: true, subtree: true }); });
		player_control_play.each(function () { observerPlay.observe(this, { childList: true, characterData: true, subtree: true }); });

		// observe change in DOM, and attach observerPlay to all the "love" icons
		var oberserLoveIcons = new MutationObserver(function(mutations) 
		{
			$(".svg-icon-love-outline").each(function(){ observerPlay.observe(this, { attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'data-action'] }); });
		});
		oberserLoveIcons.observe(document, { childList: true, subtree: true });
		
		updateDeezerControlData();
	}
	// failure to initialize
	else 
	{
		triggerRemoveDeezerData();
	}
})();
