
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
var observerPlay = new MutationObserver(function(mutations) 
{
	if (mutations.length == 1)
    {
      var mutation = mutations[0];
      if (mutation.oldValue != mutation.target.getAttribute(mutation.attributeName))
        updateMyPlayerInfo();
    }
});
observerPlay.observe(document.getElementById('player_control_play'), { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });  


// observe the changes of content of #player_track_title, to track song changes
var observerTrackTitle = new MutationObserver(function(mutations) { updateMyPlayerInfo(); });
observerTrackTitle.observe(document.getElementById('player_track_title'), { childList: true, characterData: true }); 

// update content on first load
updateMyPlayerInfo();