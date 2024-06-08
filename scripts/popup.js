$(() => {
  $.fn.extend({
    visibilityToggle: function (showOrHide) {
      return this.css('visibility', showOrHide === true ? 'visible' : 'hidden');
    },
  });
});

function preparePopup() {
  'use strict';
  loadStyle();

  // add interactivity
  $('#control-prev').on('click', () => {
    executePlayerAction('previoustrack');
    return false;
  });

  $('#control-pause').on('click', () => {
    executePlayerAction('pause');
    return false;
  });

  $('#control-play').on('click', () => {
    executePlayerAction('play');
    return false;
  });

  $('#control-next').on('click', () => {
    executePlayerAction('nexttrack');
    return false;
  });

  $('#control-like').on('click', () => {
    executePlayerAction('like');
    return false;
  });

  $('#now_playing_info_track').on('click', () => {
    executeDoAction('linkCurrentSong');
    return false;
  });

  $('#now_playing_info_artist').on('click', () => {
    executeDoAction('linkCurrentArtist');
    return false;
  });

  // add tooltip in case of ellipsis (onmouseover to force recompute in the event of style change)
  $('#now_playing_info > span').mouseover(() => {
    var title = '';
    if (this.offsetWidth < this.scrollWidth) {
      title = $(this).text();
    }

    $(this).attr('title', title);
  });

  // reset popup
  setTimeout(refreshPopup, 0);
}

function loadStyle(iPopupStyle) {
  'use strict';

  var aPopupStyle = iPopupStyle || LOCSTO.popup.style,
    aPopupCss = $('#popup_style_css');
  if (aPopupStyle !== null && aPopupCss.length) {
    aPopupCss.attr('href', 'css/' + aPopupStyle + '/popup.css');
  }
}

function executePlayerAction(iCommand) {
  'use strict';
  chrome.runtime.sendMessage({ type: 'controlPlayer', command: iCommand, source: 'popup' });
  return false;
}

// change focus to Deezer tab, and execute wanted action
function executeDoAction(iAction) {
  'use strict';
  chrome.runtime.sendMessage({ type: 'doAction', action: iAction });
}

function updatePopup(playingData) {
  if (!playingData) {
    $('#now_playing_info').hide();
    $('#control-pause').hide();
    $('#control-like').removeClass('is_liked').addClass('not_liked');
    $('#cover').attr('src', 'imgs/unknown_cd.png');
    return;
  }

  // precache covers
  new Image().src = playingData.dz_prev_cover;
  new Image().src = playingData.dz_cover;
  new Image().src = playingData.dz_next_cover;

  // is song liked?
  var isLiked = playingData.dz_is_liked === 'true';
  $('#control-like').toggleClass('not_liked', !isLiked).toggleClass('is_liked', isLiked);

  // show pause or play button
  var showPause = playingData.dz_playing === 'true';
  $('#control-play').css('display', 'inline-block').toggle(!showPause);
  $('#control-pause').css('display', 'inline-block').toggle(showPause);

  // set track title and artist
  $('#now_playing_info').show();
  $('#now_playing_info_track').text(playingData.dz_track);
  $('#now_playing_info_artist').text(playingData.dz_artist);

  // show or hide prev / next buttons if needed
  $('#control-prev').visibilityToggle(playingData.dz_is_prev_active === 'true');
  $('#control-next').visibilityToggle(playingData.dz_is_next_active === 'true');

  // get the cover
  $('#cover').attr('src', playingData.dz_cover);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'updateSession':
      updatePopup(request.nowPlayingData);
      break;
  }

  return false;
});

// initial load
const playingData = await chrome.runtime.sendMessage({ type: 'getDeezerData' });
updatePopup(playingData);
