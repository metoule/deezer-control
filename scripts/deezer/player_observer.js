
// update content on first load
(function()
{
	class DeezerControl {
		play() {
			dzPlayer.control.play();
		}

		pause() {
			dzPlayer.control.pause();
		}

		previoustrack() {
			dzPlayer.control.prevSong();
		}

		nexttrack() {
			dzPlayer.control.nextSong();
		}

		like() {
			$('.track-actions button.svg-icon-group-btn.option-btn').click();
		}

		linkCurrentSong() {
			loadBox(document.getElementById('DeezerControlData').getAttribute('dz_album_link'));
		}

		linkCurrentArtist() {
			loadBox(document.getElementById('DeezerControlData').getAttribute('dz_artist_link'));
		}

		executeAction(action) {
			if (!dzPlayer || !dzPlayer.control)
				return;

			// in case of media keys, we don't know if it's pause or play
			if (action === 'playpause') {
				action = dzPlayer.isPlaying() ? 'pause' : 'play';
			}

			if (typeof this[action] === 'function') {
				this[action]();
				return;
			}

			console.error('DeezerControl: unknown action ', action);
		}
	}


	const deezerControl = new DeezerControl();


	function GetCover(type, albumId) {
		albumId = albumId || '';
		return "https://e-cdns-images.dzcdn.net/images/" + type + '/' + albumId + "/250x250-000000-80-0-0.jpg";
	}

	function GetCoverFromAlbumId(streamId) {
		return GetCover('cover', streamId);
	}

	function GetCoverFromStreamId(streamId) {
		return GetCover('misc', streamId);
	}

	function GetCoverFromPodcastId(podcastId) {
		return GetCover('talk', podcastId);
	}

	function getSongMetadata() {
		dzCurrentSong = dzPlayer.getCurrentSong() || {};
		dzPrevSong = dzPlayer.getPrevSong() || {};
		dzNextSong = dzPlayer.getNextSong() || {};

		return {
			artist: dzCurrentSong.ART_NAME,
			track: dzCurrentSong.SNG_TITLE,
			albumPic: GetCoverFromAlbumId(dzCurrentSong.ALB_PICTURE),
			isFavorite: userData.isFavorite('song', dzCurrentSong.SNG_ID),
			artistLink: '/artist/' + dzCurrentSong.ART_ID,
			albumLink: '/album/' + dzCurrentSong.ALB_ID,
			prevCover: GetCoverFromAlbumId(dzPrevSong.ALB_PICTURE),
			nextCover: GetCoverFromAlbumId(dzNextSong.ALB_PICTURE),
		};
	}

	function getRadioMetadata() {
		dzCurrentSong = dzPlayer.getCurrentSong() || {};
		dzPrevSong = dzPlayer.getPrevSong() || {};
		dzNextSong = dzPlayer.getNextSong() || {};

		return {
			artist: '',
			track: dzCurrentSong.LIVESTREAM_TITLE,
			albumPic: GetCoverFromStreamId(dzCurrentSong.LIVESTREAM_IMAGE_MD5),
			isFavorite: userData.isFavorite('live_stream', dzCurrentSong.LIVE_ID),
			artistLink: '',
			albumLink: '/radio',
			prevCover: GetCoverFromStreamId(dzPrevSong.LIVESTREAM_IMAGE_MD5),
			nextCover: GetCoverFromAlbumId(dzNextSong.LIVESTREAM_IMAGE_MD5),
		};
	}

	function getPodcastMetadata() {
		dzCurrentSong = dzPlayer.getCurrentSong() || {};
		dzPrevSong = dzPlayer.getPrevSong() || {};
		dzNextSong = dzPlayer.getNextSong() || {};

		return {
			artist: dzCurrentSong.SHOW_NAME,
			track: dzCurrentSong.EPISODE_TITLE,
			albumPic: GetCoverFromPodcastId(dzCurrentSong.EPISODE_IMAGE_MD5 || dzCurrentSong.SHOW_ART_MD5),
			isFavorite: userData.isFavorite('show', dzCurrentSong.SHOW_ID),
			artistLink: '/show/' + dzCurrentSong.SHOW_ID,
			albumLink: '/episode/' + dzCurrentSong.EPISODE_ID,
			prevCover: GetCoverFromPodcastId(dzPrevSong.EPISODE_IMAGE_MD5 || dzPrevSong.SHOW_ART_MD5),
			nextCover: GetCoverFromPodcastId(dzNextSong.EPISODE_IMAGE_MD5 || dzNextSong.SHOW_ART_MD5),
		};
	}

	// get data from JS object dzPlayer
	function updateDeezerControlData() {
		"use strict";
		var DeezerControlData = document.getElementById('DeezerControlData'),
			isPlaying = dzPlayer.isPlaying(),
			isPrevActive = dzPlayer.getPrevSong() !== null,
			isNextActive = dzPlayer.getNextSong() !== null;

		var metadata = {};
		switch (dzPlayer.getMediaType()) {
			case 'song':
				metadata = getSongMetadata();
				break;

			case 'live_stream':
				metadata = getRadioMetadata();
				break;

			case 'episode':
				metadata = getPodcastMetadata();
				break;
		}

		DeezerControlData.setAttribute('dz_is_active', true);
		DeezerControlData.setAttribute('dz_playing', isPlaying);
		DeezerControlData.setAttribute('dz_artist', metadata.artist);
		DeezerControlData.setAttribute('dz_track', metadata.track);
		DeezerControlData.setAttribute('dz_is_liked', metadata.isFavorite);
		DeezerControlData.setAttribute('dz_artist_link', metadata.artistLink);
		DeezerControlData.setAttribute('dz_album_link', metadata.albumLink);
		DeezerControlData.setAttribute('dz_cover', metadata.albumPic);
		DeezerControlData.setAttribute('dz_prev_cover', metadata.prevCover);
		DeezerControlData.setAttribute('dz_next_cover', metadata.nextCover);
		DeezerControlData.setAttribute('dz_is_prev_active', isPrevActive);
		DeezerControlData.setAttribute('dz_is_next_active', isNextActive);
		document.getElementById('lastUpdate').textContent = Math.floor(new Date().getTime());

		// update media session artwork
		updateMediaSession(metadata);
	}

	function registerMediaSession() {
		if (!('mediaSession' in navigator)) {
			return;
		}

		navigator.mediaSession.setActionHandler('play', deezerControl.executeAction);
		navigator.mediaSession.setActionHandler('pause', deezerControl.executeAction);
		navigator.mediaSession.setActionHandler('previoustrack', deezerControl.executeAction);
		navigator.mediaSession.setActionHandler('nexttrack', deezerControl.executeAction);
	}

	function updateMediaSession(metadata) {
		if (!('mediaSession' in navigator)) {
			return;
		}

		var artwork = [];
		if (metadata.albumPic) {
			artwork.push({
				sizes: "250x250",
				src: metadata.albumPic
			})
		}

		navigator.mediaSession.metadata = new MediaMetadata({
			title: metadata.track,
			artist: metadata.artist,
			album: metadata.album,
			artwork: artwork,
		});
	}

	// ensure the player is on the page, 
	// otherwise trigger the observer on removeMe
	if (!dzPlayer || !dzPlayer.control) {
		document.getElementById('removeMe').textContent = "now";
		return;
	}

	// register custom event listener for extension events
	document.getElementById('DeezerControlData').addEventListener('deezerControl', function (evt) {
		deezerControl.executeAction(evt.detail.action);
	});

    Events.subscribe(Events.player.paused, updateDeezerControlData);
    Events.subscribe(Events.user.addFavorite, updateDeezerControlData);
    Events.subscribe(Events.user.deleteFavorite, updateDeezerControlData);

	registerMediaSession();
	updateDeezerControlData();

})();
