
function GetCoverForSound(sound)
{
	"use strict";
	var artworkUrl = sound.artwork_url;
	if (artworkUrl === null)
	{
		artworkUrl = sound.user.avatar_url;
	}
	return artworkUrl.replace("large.jpg", "t200x200.jpg");
}

// get data from JS object dzPlayer
function getDeezerControlDataFromPlayManager(playManager, soundLikes)
{
	"use strict";
	
	var DeezerControlData = document.getElementById('DeezerControlData');
	
	var dzCurrentSong = { id: '', title: '', artwork_url: '', user: { username: '' } };
	if (playManager.hasCurrentSound() && playManager.getCurrentSound() !== undefined)
		dzCurrentSong = playManager.getCurrentSound().attributes;
	
	var dzPrevSong = { artwork_url: '' };
	if (playManager.hasPrevSound())
		dzPrevSong = playManager.getPrevSound().attributes;
	
	// getNextSound doesn't exist :(
	var dzNextSong = { artwork_url: '' };
	//if (playManager.hasNextSound())
	//	dzNextSong = playManager.getNextSound();
	DeezerControlData.setAttribute('dz_is_active',   playManager.hasCurrentSound());
	DeezerControlData.setAttribute('dz_playing',	 $(".playControl.sc-ir").hasClass("playing"));
	DeezerControlData.setAttribute('dz_artist',	     dzCurrentSong.user.username);
	DeezerControlData.setAttribute('dz_track',	     dzCurrentSong.title);
	DeezerControlData.setAttribute('dz_is_liked',	 new soundLikes().get(dzCurrentSong.id));
	DeezerControlData.setAttribute('dz_cover',	     GetCoverForSound(dzCurrentSong));
	DeezerControlData.setAttribute('dz_prev_cover',  GetCoverForSound(dzPrevSong));
	DeezerControlData.setAttribute('dz_next_cover',  GetCoverForSound(dzNextSong));
	DeezerControlData.setAttribute('dz_is_prev_active',   playManager.hasPrevSound());
	DeezerControlData.setAttribute('dz_is_next_active',   playManager.hasNextSound());
	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime());
}

function updateDeezerControlData()
{
	"use strict";
    require(['lib/play-manager', 'models/sound-likes'], getDeezerControlDataFromPlayManager);
}

// process actions
function executeAction(action)
{
	"use strict";
    require(['lib/play-manager', 'lib/action-controller'], function (playManager, actionController) 
	{
    	switch (action) {
		case 'pause':
			playManager.pauseCurrent();
			break;
		case 'play':
			playManager.playCurrent();
			break;
		case 'prev':
			playManager.playPrev();
			break;
		case 'next':
			playManager.playNext();
			break;
		case 'like':
			actionController.like(playManager.getCurrentSound().id);
			break;
		}
	});
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

function deezerControlMethod_like()
{
	"use strict";
	executeAction('like');
}

function deezerControlMethod_linkCurrentSong()
{
	"use strict";
    require(['lib/play-manager', 'config'], function (playManager, config) 
	{
		if (playManager.hasCurrentSound() && playManager.getCurrentSound() !== undefined)
		{
			config.get("router").navigate(playManager.getCurrentSound().attributes.permalink_url.replace(/^https?:\/\/.*?\//, "/"));
			config.get("router").reload();
		}
	});
}

function deezerControlMethod_linkCurrentArtist()
{
	"use strict";
    require(['lib/play-manager', 'config'], function (playManager, config) 
	{
		if (playManager.hasCurrentSound() && playManager.getCurrentSound() !== undefined)
		{
			config.get("router").navigate(playManager.getCurrentSound().attributes.user.permalink_url.replace(/^https?:\/\/.*?\//, "/"));
			config.get("router").reload();
		}
	});
}

// trigger the observer on removeMe
function triggerRemoveDeezerData()
{
	document.getElementById('removeMe').textContent = "now"; 
}

//update content on first load
(function()
{
	"use strict";
	var player_track_title = $(".playbackTitle, .sc-button-like");

	// ensure the player is on the page
	if (player_track_title.length > 0 && require !== null)
	{
		// observe the changes of content of .playbackTitle, to track song changes and play / pause
		// (class changingTitle or paused are added)
		var observerPlay = new MutationObserver(function(mutations) 
		{
			"use strict";	
						
			var bUpdateInfo = false, i, mutation;
			for (i = 0; i < mutations.length && !bUpdateInfo; i++)
			{
				mutation = mutations[i];
				
				// result of 'playControl' observer
				if (mutation.type === "attributes")
				{
					bUpdateInfo  = mutation.oldValue !== mutation.target.getAttribute(mutation.attributeName);
				}
			}
	
			if (bUpdateInfo)
			{
				updateDeezerControlData();
			}
		});

		player_track_title.each(function ()  { observerPlay.observe(this, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] }); });

		updateDeezerControlData();
	}
	// failure to initialize
	else
		triggerRemoveDeezerData();
})();