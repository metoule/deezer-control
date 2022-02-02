
function GetCoverFromAlbumId(albumId)
{
	"use strict";
	if (albumId === undefined || albumId === null)
		albumId = "";
	
	return "https://e-cdn-images.dzcdn.net/images/cover/" + albumId + "/250x250-000000-80-0-0.jpg";
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
		dzCurrentSong = dzPlayer.getCurrentSong() || { ALB_PICTURE: '', ART_ID: '', ALB_ID: '' };
	} catch (e) {
		// NOP
	}

	try 
	{
		dzPrevSong = dzPlayer.getPrevSong() || { ALB_PICTURE: '' };
	} catch (e) {
		// NOP
	}

	try 
	{
		dzNextSong = dzPlayer.getNextSong() || { ALB_PICTURE: '' };
	} catch (e) {
		// NOP
	}
	
	isPlaying = dzPlayer.isPlaying();

	var metadata = {
		artist: dzPlayer.getArtistName(), 
		track: dzPlayer.getSongTitle(), 
		album: dzPlayer.getAlbumTitle(), 
		albumPic: GetCoverFromAlbumId(dzCurrentSong.ALB_PICTURE), 
	};
	
	DeezerControlData.setAttribute('dz_is_active',   true);
	DeezerControlData.setAttribute('dz_playing',	 isPlaying);
	DeezerControlData.setAttribute('dz_artist',	     metadata.artist);
	DeezerControlData.setAttribute('dz_track',	     metadata.track);
	DeezerControlData.setAttribute('dz_is_liked',	 userData.isFavorite('song', dzCurrentSong.SNG_ID));
	DeezerControlData.setAttribute('dz_artist_id',   dzCurrentSong.ART_ID);
	DeezerControlData.setAttribute('dz_album_id',    dzCurrentSong.ALB_ID);
	DeezerControlData.setAttribute('dz_cover',	     metadata.albumPic);
	DeezerControlData.setAttribute('dz_prev_cover',  GetCoverFromAlbumId(dzPrevSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_next_cover',  GetCoverFromAlbumId(dzNextSong.ALB_PICTURE));
	DeezerControlData.setAttribute('dz_is_prev_active', isPrevActive);
	DeezerControlData.setAttribute('dz_is_next_active', isNextActive);
	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime()); 

	// update media session artwork
	updateMediaSession(metadata);
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

function registerMediaSession() {
	if (!('mediaSession' in navigator)) {
		return;
	}

	navigator.mediaSession.setActionHandler('play', deezerControlMethod_play);
	navigator.mediaSession.setActionHandler('pause', deezerControlMethod_pause);
	navigator.mediaSession.setActionHandler('previoustrack', deezerControlMethod_prev);
	navigator.mediaSession.setActionHandler('nexttrack', deezerControlMethod_next);
}

function updateMediaSession(metadata) {
	if (!('mediaSession' in navigator)) {
		return;
	}

	navigator.mediaSession.metadata = new MediaMetadata({
		title: metadata.track,
		artist: metadata.artist,
		album: metadata.album,
		artwork: [{
			sizes: "250x250", 
			src: metadata.albumPic, 
		}]
	});
}

// update content on first load
(function()
{
    "use strict";

	// ensure the player is on the page
	if (!dzPlayer) {
		triggerRemoveDeezerData();
		return;
	}

    Events.subscribe(Events.player.paused, updateDeezerControlData);
    Events.subscribe(Events.user.addFavorite, updateDeezerControlData);
    Events.subscribe(Events.user.deleteFavorite, updateDeezerControlData);

	registerMediaSession();
	updateDeezerControlData();

})();
