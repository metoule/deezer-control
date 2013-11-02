
// get data from JS object dzPlayer
function updateMyPlayerInfo()
{
	myPlayerInfo = $('#myPlayerInfo');
	myPlayerInfo.attr('dz_playing',    $('#player_control_play').css('display') == 'none');
	myPlayerInfo.attr('dz_artist',      dzPlayer.getArtistName());
	myPlayerInfo.attr('dz_artist_id',  (dzPlayer.getCurrentSongInfo() != null ? dzPlayer.getCurrentSongInfo().ART_ID : ''));
	myPlayerInfo.attr('dz_track',       dzPlayer.getSongTitle());
	myPlayerInfo.attr('dz_album',       dzPlayer.getAlbumTitle());
	myPlayerInfo.attr('dz_album_id',   (dzPlayer.getCurrentSongInfo() != null ? dzPlayer.getCurrentSongInfo().ALB_ID : ''));
	myPlayerInfo.attr('dz_cover',       dzPlayer.getCover());
	myPlayerInfo.attr('dz_prev_cover', (dzPlayer.getPrevSongInfo() != null ? dzPlayer.getPrevSongInfo().ALB_PICTURE : ''));
	myPlayerInfo.attr('dz_next_cover', (dzPlayer.getNextSongInfo() != null ? dzPlayer.getNextSongInfo().ALB_PICTURE : ''));
	myPlayerInfo.attr('dz_is_prev_active',   playercontrol.prevButtonActive());
	myPlayerInfo.attr('dz_is_next_active',   playercontrol.nextButtonActive());
	$('#lastUpdate').text(Math.floor(new Date().getTime())); 
}; 


// observe the changes of style atttribute of #player_control_play, to track play / pause changes
// (its style changes from hidden to display)
// observe the changes of content of #player_track_title, to track song changes
var observerPlay = new MutationObserver(function(mutations) 
{
	var bUpdateInfo = false;
	for (var i = 0; i < mutations.length && !bUpdateInfo; i++)
	{
		var mutation = mutations[i];
		
		// result of 'player_control_play' observer
		if (mutation.type == "attributes")
			bUpdateInfo  = mutation.oldValue != mutation.target.getAttribute(mutation.attributeName);
		
		// result of 'player_track_title' observer
		else if (mutation.type == "characterData" || mutation.type == "childList")
			bUpdateInfo = true;
	}

	if (bUpdateInfo)
		updateMyPlayerInfo();
});  
observerPlay.observe(document.getElementById('player_track_title'),  { childList: true, characterData: true });  
observerPlay.observe(document.getElementById("player_control_play"), { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });


// update content on first load
updateMyPlayerInfo();