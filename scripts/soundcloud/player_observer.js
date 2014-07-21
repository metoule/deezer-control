
function GetCoverFromArtworkUrl(artworkUrl)
{
	"use strict";
	return artworkUrl.replace("large.jpg", "t200x200.jpg");
}

// get data from JS object dzPlayer
function updateDeezerControlData()
{
	"use strict";
	
	$(function () 
	{
		"use strict";
	    require(['lib/play-manager'], function (playManager) 
		{
	    	var DeezerControlData = document.getElementById('DeezerControlData');
	    	
	    	var dzCurrentSong = { title: '', artwork_url: '', user: { username: '' } };
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
	    	DeezerControlData.setAttribute('dz_cover',	     GetCoverFromArtworkUrl(dzCurrentSong.artwork_url));
	    	DeezerControlData.setAttribute('dz_prev_cover',  GetCoverFromArtworkUrl(dzPrevSong.artwork_url));
	    	DeezerControlData.setAttribute('dz_next_cover',  GetCoverFromArtworkUrl(dzNextSong.artwork_url));
	    	DeezerControlData.setAttribute('dz_is_prev_active',   playManager.hasPrevSound());
	    	DeezerControlData.setAttribute('dz_is_next_active',   playManager.hasNextSound());
	    	document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime());
		});
	});
}

// process actions
function executeAction(action)
{
	"use strict";
	$(function () 
	{
		"use strict";
	    require(['lib/play-manager'], function (playManager) 
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
			}
		});
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

function deezerControlMethod_linkCurrentSong()
{
	"use strict";
	// TODO
}

function deezerControlMethod_linkCurrentArtist()
{
	"use strict";
	// TODO loadBox('artist/' + document.getElementById('DeezerControlData').getAttribute('dz_artist_id'));
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
	var playbackTitle = $(".playbackTitle")[0];

	// ensure the player is on the page
	if (playbackTitle !== null && require !== null)
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

		observerPlay.observe(playbackTitle, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });

		updateDeezerControlData();
	}
	// failure to initialize
	else
		triggerRemoveDeezerData();
})();