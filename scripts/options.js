import { LocalStorage, hotkeyNames } from './localstorage.js';

const LOCSTO = new LocalStorage();
await LOCSTO.loadOptions();

$(() => {
  window.addEventListener('hashchange', function (/*e*/) {
    'use strict';
    showSection(location.hash.replace(/^\#/, ''));
  });

  function showSaveStatus(statusId) {
    $('#' + statusId)
      .stop(true, true)
      .text(chrome.i18n.getMessage('options_page_options_saved'))
      .show()
      .fadeOut(1500);
  }

  function preparePage() {
    'use strict';
    i18n.process(document);

    preparePage_welcome();
    preparePage_style();
    preparePage_hotKeys();
    preparePage_notifs();
    preparePage_misc();

    resetSections();
  }

  function preparePage_welcome() {
    'use strict';
    $('#button_rate_extension').attr(
      'href',
      'https://chrome.google.com/webstore/detail/' + chrome.i18n.getMessage('@@extension_id')
    );
  }

  function changeStyle(iPopupStyle) {
    'use strict';
    $('#popup_style_css').attr('href', 'css/' + iPopupStyle + '/popup.css');
  }

  function preparePage_style() {
    'use strict';

    // create interactivity
    $('#popup_style_chooser').change(function () {
      changeStyle($('#popup_style_chooser').val());
    });
    $('#button_save_style').click(savePopupStyle);

    // restore value
    $('#popup_style_chooser').val(LOCSTO.popup.style);
  }

  function preparePage_hotKeys() {
    'use strict';

    // create interactivity
    $('#button_activate_hotkeys').click(activateHotKeys);
    $('#button_disable_hotkeys').click(disableHotKeys);
    $('#button_save_hotkeys').click(saveHotKeys);

    // restore value
    hotkeyNames.forEach(restoreHotkey);

    // hot keys are activated only if we have permission on all tabs
    // if we don't permission, show an explanation
    chrome.permissions.contains({ origins: ['<all_urls>'] }, function (granted) {
      displayHotKeysOptions(granted);
    });
  }

  function preparePage_notifs() {
    'use strict';

    // create interactivity
    $('#button_save_notifications').click(saveNotifications);

    // restore value
    if (LOCSTO.notifications.onSongChange) {
      $('input:radio[name="notifs_show_when"]').filter('[value="on_song_change"]').prop('checked', true);
    } else if (LOCSTO.notifications.onHotKeyOnly) {
      $('input:radio[name="notifs_show_when"]').filter('[value="on_hotkey_only"]').prop('checked', true);
    } else {
      $('input:radio[name="notifs_show_when"]').filter('[value="never"]').prop('checked', true);
    }
  }

  function preparePage_misc() {
    'use strict';

    // create interactivity
    $('#miscLimitDeezerToOneTab > .yes_no_bar')
      .children('button')
      .click(function () {
        if (!$(this).hasClass('btn_selected')) {
          $(this).parent().children('button').toggleClass('btn_selected btn_unselected');
        }
      });
    $('#button_save_misc').click(saveMiscOptions);

    // restore value
    $('#miscLimitDeezerToOneTab > .yes_no_bar')
      .children('button:eq(0)')
      .toggleClass('btn_unselected', !LOCSTO.miscOptions.limitDeezerToOneTab)
      .toggleClass('btn_selected', LOCSTO.miscOptions.limitDeezerToOneTab);
    $('#miscLimitDeezerToOneTab > .yes_no_bar')
      .children('button:eq(1)')
      .toggleClass('btn_unselected', LOCSTO.miscOptions.limitDeezerToOneTab)
      .toggleClass('btn_selected', !LOCSTO.miscOptions.limitDeezerToOneTab);
  }

  function displayHotKeysOptions(granted) {
    'use strict';

    $('#hotkey_permission_ko').toggle(!granted);
    $('#hotkey_permission_ok').toggle(granted);
  }

  function restoreHotkey(iHotKeyName) {
    'use strict';

    var aHotKeySelect = $('#' + iHotKeyName + 'HotKey');
    if (!aHotKeySelect.length) {
      return;
    }

    // on click, all button are selected
    aHotKeySelect.children('button').click(function () {
      $(this).toggleClass('btn_selected btn_unselected');
    });
    aHotKeySelect.children('span').css('visibility', 'visible');

    // last button: click reveals the textbox to enter new key
    aHotKeySelect
      .children('button:eq(3)')
      .unbind('click')
      .click(function () {
        $(this).parent().children('span').text('');
        $(this).css('display', 'none');
        $(this).parent().children('input:eq(0)').css('display', 'inline').focus();
      });

    // on key up in the input box, update last button with the new key code
    aHotKeySelect.children('input:eq(0)').keydown(function () {
      // if ctrl, shift or alt, prevent update and warn user
      if (event.keyCode >= 16 && event.keyCode <= 18) {
        $(this)
          .parent()
          .children('span')
          .text(chrome.i18n.getMessage('options_page_tab_hotkeys_warning_illegal_hotkey'));
      } else {
        $(this).parent().children('button:eq(3)').text(convertKeyCode(event.keyCode));
        $(this).next().val(event.keyCode); // input:eq(1)
      }

      // redisplay
      $(this).parent().children('button:eq(3)').css('display', 'inline').focus().blur();
      $(this).css('display', 'none').val('');
    });

    aHotKeySelect.children('input:eq(0)').blur(function () {
      $(this).css('display', 'none').val('');
      $(this).parent().children('button:eq(3)').css('display', 'inline').focus().blur();
    });

    // create display
    const hotkeyConfig = LOCSTO.hotkeys[iHotKeyName];
    aHotKeySelect
      .children('button:eq(0)')
      .toggleClass('btn_unselected', !hotkeyConfig.shiftKey)
      .toggleClass('btn_selected', hotkeyConfig.shiftKey);
    aHotKeySelect
      .children('button:eq(1)')
      .toggleClass('btn_unselected', !hotkeyConfig.ctrlKey)
      .toggleClass('btn_selected', hotkeyConfig.ctrlKey);
    aHotKeySelect
      .children('button:eq(2)')
      .toggleClass('btn_unselected', !hotkeyConfig.altKey)
      .toggleClass('btn_selected', hotkeyConfig.altKey);
    aHotKeySelect.children('button:eq(3)').text(convertKeyCode(hotkeyConfig.keyCode));

    aHotKeySelect.children('input').attr('size', '3').css('display', 'none');
    aHotKeySelect.children('input:eq(1)').val(hotkeyConfig.keyCode);
  }

  async function savePopupStyle() {
    'use strict';

    LOCSTO.popup.style = $('#popup_style_chooser').val();
    await LOCSTO.saveOptions();

    // Update status to let user know options were saved.
    showSaveStatus('status_style');
  }

  async function saveHotKeys() {
    'use strict';

    hotkeyNames.forEach((name) => {
      storeHotKey(name);
    });

    await LOCSTO.saveOptions();

    // Update status to let user know options were saved.
    showSaveStatus('status_hotkeys');
  }

  function storeHotKey(iHotKeyName) {
    'use strict';

    var aHotKeyDiv = $('#' + iHotKeyName + 'HotKey');
    if (!aHotKeyDiv.length) {
      return;
    }

    LOCSTO.hotkeys[iHotKeyName].shiftKey = aHotKeyDiv.children('button:eq(0)').hasClass('btn_selected');
    LOCSTO.hotkeys[iHotKeyName].ctrlKey = aHotKeyDiv.children('button:eq(1)').hasClass('btn_selected');
    LOCSTO.hotkeys[iHotKeyName].altKey = aHotKeyDiv.children('button:eq(2)').hasClass('btn_selected');
    LOCSTO.hotkeys[iHotKeyName].keyCode = parseInt(aHotKeyDiv.children('input:eq(1)').val(), 10);
  }

  async function saveHotkeysPermission(granted) {
    LOCSTO.miscOptions.hasHotkeysPermission = granted;
    await LOCSTO.saveOptions();
  }

  async function saveNotifications() {
    'use strict';

    var aNotifsShowWhen = $('input:radio[name="notifs_show_when"]:checked').val();

    if (aNotifsShowWhen === 'on_song_change') {
      LOCSTO.notifications = { never: false, onSongChange: true, onHotKeyOnly: false };
    } else if (aNotifsShowWhen === 'on_hotkey_only') {
      LOCSTO.notifications = { never: false, onSongChange: false, onHotKeyOnly: true };
    }

    await LOCSTO.saveOptions();

    // Update status_style to let user know options were saved.
    showSaveStatus('status_notifs');

    // reshow notifs so that the user sees the change straight away
    chrome.runtime.sendMessage({ type: 'showNotif' });
  }

  async function saveMiscOptions() {
    'use strict';

    // limit deezer to one tab
    LOCSTO.miscOptions.limitDeezerToOneTab = $('#miscLimitDeezerToOneTab > .yes_no_bar')
      .children('button:eq(0)')
      .hasClass('btn_selected');

    await LOCSTO.saveOptions();

    // Update status to let user know options were saved.
    showSaveStatus('status_misc');
  }

  // deal with chrome permissions
  const hotkeyPermissions = { origins: ['<all_urls>'], permissions: ['scripting'] };
  function activateHotKeys() {
    'use strict';
    chrome.permissions.request(hotkeyPermissions, function (granted) {
      if (granted) {
        chrome.runtime.sendMessage({ type: 'injectHotKeysJsOnAllTabs' });
      }
      displayHotKeysOptions(granted);
      saveHotkeysPermission(granted);
    });
  }

  function disableHotKeys() {
    'use strict';
    chrome.permissions.remove(hotkeyPermissions, function (removed) {
      displayHotKeysOptions(!removed);
      saveHotkeysPermission(!removed);
    });
  }

  // navigation bar
  function resetSections() {
    'use strict';

    $('#tab_chooser > nav > a:first').addClass('currentone');
    $('#center_block > section:first').css('display', 'block');
    if (location.hash) {
      showSection(location.hash.replace(/^\#/, ''));
    }
  }

  function showSection(id) {
    'use strict';
    var aNewLeft;

    $('#tab_chooser > nav > a').removeClass('currentone');
    $('#center_block > section:not(#' + id + ')').css('display', 'none');
    $('#' + id).css('display', 'block');
    $('#' + id + '_nav').addClass('currentone');

    aNewLeft = $('#' + id + '_nav').position().left - $('#tab_chooser > nav > a:first').position().left + 73;
    $('#arrow_line > span').css('left', aNewLeft + 'px');
  }

  preparePage();
});

function convertKeyCode(iKeyCode) {
  'use strict';
  var aMapKeyToText = {
    8: 'keycode_text_backspace',
    9: 'keycode_text_tab',
    13: 'keycode_text_enter',
    16: 'keycode_text_shift',
    17: 'keycode_text_ctrl',
    18: 'keycode_text_alt',
    19: 'keycode_text_pause_break',
    20: 'keycode_text_caps_lock',
    27: 'keycode_text_escape',
    32: 'keycode_text_space',
    33: 'keycode_text_page_up',
    34: 'keycode_text_page_down',
    35: 'keycode_text_end',
    36: 'keycode_text_home',
    37: 'keycode_text_left_arrow',
    38: 'keycode_text_up_arrow',
    39: 'keycode_text_right_arrow',
    40: 'keycode_text_down_arrow',
    42: 'keycode_text_print_screen',
    45: 'keycode_text_insert',
    46: 'keycode_text_delete',
    91: 'keycode_text_left_window_key',
    92: 'keycode_text_right_window_key',
    93: 'keycode_text_select_key',
    96: 'keycode_text_numpad_0',
    97: 'keycode_text_numpad_1',
    98: 'keycode_text_numpad_2',
    99: 'keycode_text_numpad_3',
    100: 'keycode_text_numpad_4',
    101: 'keycode_text_numpad_5',
    102: 'keycode_text_numpad_6',
    103: 'keycode_text_numpad_7',
    104: 'keycode_text_numpad_8',
    105: 'keycode_text_numpad_9',
    106: 'keycode_text_numpad_multiply',
    107: 'keycode_text_numpad_plus',
    109: 'keycode_text_numpad_minus',
    110: 'keycode_text_numpad_dot',
    111: 'keycode_text_numpad_slash',
    112: 'keycode_text_F1',
    113: 'keycode_text_F2',
    114: 'keycode_text_F3',
    115: 'keycode_text_F4',
    116: 'keycode_text_F5',
    117: 'keycode_text_F6',
    118: 'keycode_text_F7',
    119: 'keycode_text_F8',
    120: 'keycode_text_F9',
    121: 'keycode_text_F10',
    122: 'keycode_text_F11',
    123: 'keycode_text_F12',
    144: 'keycode_text_num_lock',
    145: 'keycode_text_scroll_lock',
    176: 'keycode_text_media_key_next',
    177: 'keycode_text_media_key_prev',
    178: 'keycode_text_media_key_stop',
    179: 'keycode_text_media_key_play',
    186: 'keycode_text_semi_column',
    187: 'keycode_text_equal',
    188: 'keycode_text_coma',
    189: 'keycode_text_minus',
    190: 'keycode_text_dot',
    191: 'keycode_text_slash',
    192: 'keycode_text_grave',
    219: 'keycode_text_left_bracket',
    220: 'keycode_text_back_slash',
    221: 'keycode_text_right_bracket',
    222: 'keycode_text_quote',
  };

  if (aMapKeyToText.hasOwnProperty(iKeyCode)) {
    return chrome.i18n.getMessage(aMapKeyToText[iKeyCode]);
  }

  return String.fromCharCode(iKeyCode);
}
