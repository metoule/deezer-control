
window.addEventListener('hashchange', function(e) { showSection(location.hash.replace(/^\#/,'')); });
window.addEventListener('load', function(e) { preparePage(); });

function preparePage()
{
	restoreOptions();
	resetSections();
	i18n.process(document);

	// create interactivity
	$("#popup_style_chooser").change(function () { loadStyle($("#popup_style_chooser").val()); });
	$("#button_save_style").click(function () { savePopupStyle(); });

	$("#button_activate_hotkeys").click(function () { activateHotKeys(); });
	$("#button_save_hotkeys").click(function () { saveHotKeys(); });

	$('input:radio[name="notifs_show_when"]').change(function () { activateNotifications(); });
	$("#notifs_fade_away_delay").change(function () { refreshNotifsOptions(); });
	$("#button_save_notifications").click(function () { saveNotifications(); });

	$('#miscLimitDeezerToOneTab').children('button').click(function() { if (!$(this).hasClass('two_state_selected')) $(this).parent().children('button').toggleClass('two_state_selected two_state_unselected'); });
	$("#button_save_misc").click(function () { saveMiscOptions(); });

	$("#button_rate_extension").attr('href', "https://chrome.google.com/webstore/detail/" + chrome.i18n.getMessage("@@extension_id"));
}

// read local storage, and set interface accordingly
function restoreOptions()
{
	//		   Popup style
	//--------------------------------
	$("#popup_style_chooser").val(LOCSTO.popupStyle);


	//		Notifications
	//--------------------------------
	if (LOCSTO.notifications.alwaysOn)
		$('input:radio[name="notifs_show_when"]').filter('[value="never_hides"]').prop('checked', true);
	else if (LOCSTO.notifications.visible)
		$('input:radio[name="notifs_show_when"]').filter('[value="on_song_change"]').prop('checked', true);
	else if (LOCSTO.notifications.onHotKeyOnly)
		$('input:radio[name="notifs_show_when"]').filter('[value="on_hotkey_only"]').prop('checked', true);
	else
		$('input:radio[name="notifs_show_when"]').filter('[value="never"]').prop('checked', true);

	$('#notifs_fade_away_delay').val(LOCSTO.notifications.fadeAwayDelay / 1000);

	refreshNotifsOptions(); // ensure options are correctly shown


	//		Hot keys
	//--------------------------------
	// hot keys are activated only if we have permission on all tabs
	// if we don't permission, show an explanation
	refreshHotKeysOptions();


	//		 Misc options
	//--------------------------------
	refreshMiscOptions();
}

function refreshNotifsOptions()
{
	var aNotifsShowWhen = $('input:radio[name="notifs_show_when"]:checked').val();

	if (aNotifsShowWhen === 'on_hotkey_only' || aNotifsShowWhen === 'on_song_change')
		$('#notifs_fade_away_delay').parent().css('display', 'block');
	else
		$('#notifs_fade_away_delay').parent().css('display', 'none');

	$('#notifs_fade_away_delay_display').text($('#notifs_fade_away_delay').val());
}

function refreshHotKeysOptions()
{
	chrome.permissions.contains(
	{ origins: ['<all_urls>'] },
	function(result)
	{
		if (result)
		{
			$("#hotkey_permission_ko").css('display', 'none');
			$("#hotkey_permission_ok").css('display', 'block');

			restoreHotkey('prevHotKey');
			restoreHotkey('playPauseHotKey');
			restoreHotkey('nextHotKey');
			restoreHotkey('whatZatSongHotKey');
			restoreHotkey('jumpToDeezerHotKey');
		}
		else
		{
			$("#hotkey_permission_ko").css('display', 'block');
			$("#hotkey_permission_ok").css('display', 'none');
		}
	});
}

function restoreHotkey(iHotKeyName)
{
	var aHotKeySelect = $("#" + iHotKeyName);

	// on click, all button are selected
	aHotKeySelect.children('button').click(function() { $(this).toggleClass('two_state_selected two_state_unselected'); });
	aHotKeySelect.children('span').css('visibility', 'visible');

	// last button: click reveals the textbox to enter new key
	aHotKeySelect.children('button:eq(3)').unbind('click').click(function()
	{
		$(this).parent().children('span').text("");
		$(this).css('display', 'none');
		$(this).parent().children('input:eq(0)').css('display', 'inline').focus();
	});

	// on key up in the input box, update last button with the new key code
	aHotKeySelect.children('input:eq(0)').keydown(function()
	{
		// if ctrl, shift or alt, prevent update and warn user
		if (event.keyCode >= 16 && event.keyCode <= 18)
		{
			$(this).parent().children('span').text(chrome.i18n.getMessage("options_page_tab_hotkeys_warning_illegal_hotkey"));
		}
		else
		{
			$(this).parent().children('button:eq(3)').text(convertKeyCode(event.keyCode, $(this).val()));
			$(this).next().val(event.keyCode);
		}

		// redisplay
		$(this).parent().children('button:eq(3)').css('display', 'inline').focus().blur();
		$(this).css('display', 'none').val("");
	});

	aHotKeySelect.children('input:eq(0)').blur(function()
	{
		$(this).css('display', 'none').val("");
		$(this).parent().children('button:eq(3)').css('display', 'inline').focus().blur();
	});


	// create display
	aHotKeySelect.children('button:eq(0)').toggleClass('two_state_unselected', !LOCSTO[iHotKeyName].shiftKey).toggleClass('two_state_selected', LOCSTO[iHotKeyName].shiftKey);
	aHotKeySelect.children('button:eq(1)').toggleClass('two_state_unselected', !LOCSTO[iHotKeyName].ctrlKey).toggleClass('two_state_selected', LOCSTO[iHotKeyName].ctrlKey);
	aHotKeySelect.children('button:eq(2)').toggleClass('two_state_unselected', !LOCSTO[iHotKeyName].altKey).toggleClass('two_state_selected', LOCSTO[iHotKeyName].altKey);
	aHotKeySelect.children('button:eq(3)').text(convertKeyCode(LOCSTO[iHotKeyName].keyCode));

	aHotKeySelect.children('input').attr('size', '3').css('display', 'none');
	aHotKeySelect.children('input:eq(1)').val(LOCSTO[iHotKeyName].keyCode);
}

function refreshMiscOptions()
{
	// limit deezer to one tab
	$("#miscLimitDeezerToOneTab").children('button:eq(0)').toggleClass('two_state_unselected', !LOCSTO.miscOptions.limitDeezerToOneTab).toggleClass('two_state_selected',  LOCSTO.miscOptions.limitDeezerToOneTab);
	$("#miscLimitDeezerToOneTab").children('button:eq(1)').toggleClass('two_state_unselected',  LOCSTO.miscOptions.limitDeezerToOneTab).toggleClass('two_state_selected', !LOCSTO.miscOptions.limitDeezerToOneTab);
}


// Saves options to localStorage.
function savePopupStyle()
{
	LOCSTO.popupStyle = $("#popup_style_chooser").val();
	LOCSTO.savePopupStyle();

	// Update status to let user know options were saved.
	$("#status_style").text(chrome.i18n.getMessage("options_page_options_saved"));
	setTimeout(function() { $("#status_style").text(""); }, 750);
}

function saveHotKeys()
{
	storeHotKey('prevHotKey');
	storeHotKey('playPauseHotKey');
	storeHotKey('nextHotKey');
	storeHotKey('whatZatSongHotKey');
	storeHotKey('jumpToDeezerHotKey');
	LOCSTO.saveHotKeys();

	// Update status to let user know options were saved.
	$("#status_hotkeys").text(chrome.i18n.getMessage("options_page_options_saved"));
	setTimeout(function() { $("#status_hotkeys").text(""); }, 750);
}

function storeHotKey(iHotKeyName)
{
	var aHotKeyDiv = $("#" + iHotKeyName);

	LOCSTO[iHotKeyName].shiftKey = aHotKeyDiv.children('button:eq(0)').hasClass('two_state_selected');
	LOCSTO[iHotKeyName].ctrlKey  = aHotKeyDiv.children('button:eq(1)').hasClass('two_state_selected');
	LOCSTO[iHotKeyName].altKey   = aHotKeyDiv.children('button:eq(2)').hasClass('two_state_selected');
	LOCSTO[iHotKeyName].keyCode  = aHotKeyDiv.children('input:eq(1)').val();
}

function saveNotifications()
{
	var aNotifsShowWhen = $('input:radio[name="notifs_show_when"]:checked').val();
	var aNotifsDelay = $('#notifs_fade_away_delay').val() * 1000;

	// the key names are due to the old notifications system
	if (aNotifsShowWhen === 'never')
		LOCSTO.notifications = { never: true, alwaysOn: false, visible: false, onHotKeyOnly: false, fadeAwayDelay: aNotifsDelay };

	else if (aNotifsShowWhen === 'never_hides')
		LOCSTO.notifications = { never: false, alwaysOn: true, visible: false, onHotKeyOnly: false, fadeAwayDelay: aNotifsDelay };

	else if (aNotifsShowWhen === 'on_song_change')
		LOCSTO.notifications = { never: false, alwaysOn: false, visible: true, onHotKeyOnly: false, fadeAwayDelay: aNotifsDelay };

	else if (aNotifsShowWhen === 'on_hotkey_only')
		LOCSTO.notifications = { never: false, alwaysOn: false, visible: false, onHotKeyOnly: true, fadeAwayDelay: aNotifsDelay };

	LOCSTO.saveNotifications();

	// Update status_style to let user know options were saved.
	$("#status_notifs").text(chrome.i18n.getMessage("options_page_options_saved"));
	setTimeout(function() { $("#status_notifs").text(""); }, 750);

	// reshow notifs so that the user sees the change straight away
	chrome.extension.sendRequest({ type: "showNotif", source: "options" });
}


function saveMiscOptions()
{
	// limit deezer to one tab
	LOCSTO.miscOptions.limitDeezerToOneTab = $("#miscLimitDeezerToOneTab").children('button:eq(0)').hasClass('two_state_selected');

	LOCSTO.saveMiscOptions();

	// Update status to let user know options were saved.
	$("#status_misc").text(chrome.i18n.getMessage("options_page_options_saved"));
	setTimeout(function() { $("#status_misc").text(""); }, 750);
}

// deal with chrome permissions
function activateHotKeys()
{
	chrome.permissions.request({ origins: [ '<all_urls>' ] }, function(granted)
	{
		refreshHotKeysOptions();
	});
}

function activateNotifications()
{
	var aNotifsShowWhen = $('input:radio[name="notifs_show_when"]:checked').val();
	if (aNotifsShowWhen !== "never")
	{
		chrome.permissions.request({ permissions: ['notifications'] }, function(granted)
		{
			if (!granted)
			{
				$('#chrome_permission_not_granted').css("visibility", "visible");
				$('input:radio[name="notifs_show_when"]').filter('[value="never"]').prop('checked', true);
			}
	  	});
	}

	refreshNotifsOptions();
}

// navigation bar
function resetSections()
{
	$('#tab_chooser > nav > a:first').addClass('currentone');
	$('#center_block > section:first').css('display', 'block');
	if(location.hash)
		showSection(location.hash.replace(/^\#/, ''));
}

function showSection(id)
{
	$('#tab_chooser > nav > a').removeClass('currentone');
	$('#center_block > section:not(#' + id + ')').css('display', 'none');
	$('#' + id).css('display', 'block');
	$('#' + id + '_nav').addClass('currentone');

	var aNewLeft = $('#' + id + '_nav').position().left - $('#tab_chooser > nav > a:first').position().left + 73;
	$('#arrow_line > img').css('left', aNewLeft + 'px');
}


function convertKeyCode(iKeyCode, iPrintedValue)
{
	var aMapKeyToText = {
		   8: "keycode_text_backspace",
		   9: "keycode_text_tab",
		  13: "keycode_text_enter",
		  16: "keycode_text_shift",
		  17: "keycode_text_ctrl",
		  18: "keycode_text_alt",
		  19: "keycode_text_pause_break",
		  20: "keycode_text_caps_lock",
		  27: "keycode_text_escape",
		  32: "keycode_text_space",
		  33: "keycode_text_page_up",
		  34: "keycode_text_page_down",
		  35: "keycode_text_end",
		  36: "keycode_text_home",
		  37: "keycode_text_left_arrow",
		  38: "keycode_text_up_arrow",
		  39: "keycode_text_right_arrow",
		  40: "keycode_text_down_arrow",
		  42: "keycode_text_print_screen",
		  45: "keycode_text_insert",
		  46: "keycode_text_delete",
		  91: "keycode_text_left_window_key",
		  92: "keycode_text_right_window_key",
		  93: "keycode_text_select_key",
		  96: "keycode_text_numpad_0",
		  97: "keycode_text_numpad_1",
		  98: "keycode_text_numpad_2",
		  99: "keycode_text_numpad_3",
		 100: "keycode_text_numpad_4",
		 101: "keycode_text_numpad_5",
		 102: "keycode_text_numpad_6",	
		 103: "keycode_text_numpad_7",	
		 104: "keycode_text_numpad_8",	
		 105: "keycode_text_numpad_9",	
		 106: "keycode_text_numpad_multiply",	
		 107: "keycode_text_numpad_plus",	
		 109: "keycode_text_numpad_minus",	
		 110: "keycode_text_numpad_dot",	
		 111: "keycode_text_numpad_slash",	
		 112: "keycode_text_F1",	
		 113: "keycode_text_F2",		
		 114: "keycode_text_F3",		
		 115: "keycode_text_F4",		
		 116: "keycode_text_F5",		
		 117: "keycode_text_F6",		
		 118: "keycode_text_F7",		
		 119: "keycode_text_F8",		
		 120: "keycode_text_F9",		
		 121: "keycode_text_F10",		
		 122: "keycode_text_F11",		
		 123: "keycode_text_F12",		
		 144: "keycode_text_num_lock",	
		 145: "keycode_text_scroll_lock",
		 176: "keycode_text_media_key_next",
		 177: "keycode_text_media_key_prev",
		 178: "keycode_text_media_key_stop",
		 179: "keycode_text_media_key_play",
		 186: "keycode_text_semi_column",
		 187: "keycode_text_equal",
		 188: "keycode_text_coma",
		 189: "keycode_text_minus",
		 190: "keycode_text_dot",
		 191: "keycode_text_slash",
		 192: "keycode_text_grave",
		 219: "keycode_text_left_bracket",
		 220: "keycode_text_back_slash",
		 221: "keycode_text_right_bracket",
		 222: "keycode_text_quote"
	};
	
	if (aMapKeyToText.hasOwnProperty(iKeyCode))
		return chrome.i18n.getMessage(aMapKeyToText[iKeyCode]);
	
	return String.fromCharCode(iKeyCode);
}
