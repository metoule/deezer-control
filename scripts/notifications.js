
var NEW_NOTIFS = NEW_NOTIFS || {
		
	currentData: null,
	buttonPrev:  { title: chrome.i18n.getMessage('playback_prev'),  iconUrl: 'imgs/notifs/prev.png'  },
	buttonPlay:  { title: chrome.i18n.getMessage('playback_play'),  iconUrl: 'imgs/notifs/play.png'  },
	buttonPause: { title: chrome.i18n.getMessage('playback_pause'), iconUrl: 'imgs/notifs/pause.png' },
	buttonNext:  { title: chrome.i18n.getMessage('playback_next'),  iconUrl: 'imgs/notifs/next.png'  },
	
	createNotif: function(forceRedisplay)
	{
		"use strict";
		var notifButtons, content, newData;
		
		// we're only allowed two buttons: display play/pause, and next
		notifButtons = [];
		notifButtons.push(gNowPlayingData.dz_playing === 'true' ? this.buttonPause : this.buttonPlay);
		notifButtons.push(gNowPlayingData.dz_is_next_active === 'true' ? this.buttonNext : this.buttonPrev);
		
		content = {
				type: 'basic', 
				title:   gNowPlayingData.dz_track, 
				message: gNowPlayingData.dz_artist,
				iconUrl: 'http://cdn-images.deezer.com/images/cover/' + gNowPlayingData.dz_cover + '/80x80-000000-80-0-0.jpg',
				buttons: notifButtons,
				priority: 0
		};
		
		
		// don't update notification if same data
		newData = JSON.stringify(content);
		if (newData === this.currentData)
		{
			return;	
		}

		if (forceRedisplay)
		{
			this.destroyNotif(function(me) 
			{
				me.currentData = newData;
				chrome.notifications.create('deezer_control', content, function(/*notifId*/) {/*NOP*/});
			});
		}
		else
		{
			this.currentData = newData;
			chrome.notifications.create('deezer_control', content, function(/*notifId*/) {/*NOP*/});
		}
	}, 
	
	destroyNotif: function(callback)
	{
		"use strict";
		
		var me = this;
		chrome.notifications.clear('deezer_control', function(/*wasCleared*/) 
		{
			me.resetCurrentData(); 
			if (callback)
			{
				callback(me);
			}
		});
	}, 
	
	buttonClicked: function(buttonIndex)
	{
		"use strict";
		
		// workaround for https://code.google.com/p/chromium/issues/detail?id=246637
		var notifButton = JSON.parse(this.currentData).buttons[buttonIndex];
		this.destroyNotif(function(me) 
		{
			// we use source as hotkey to ensure that when we're on mode 'on hot keys only', 
			// the notif doesn't disappear on click
			if (notifButton.title === me.buttonPrev.title)
			{
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'prev', source: "hotkey" });
			}
			else if (notifButton.title === me.buttonPlay.title)
			{
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'play', source: "hotkey" });
			}
			else if (notifButton.title === me.buttonPause.title)
			{
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'pause', source: "hotkey" });
			}
			else if (notifButton.title === me.buttonNext.title)
			{
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'next',  source: "hotkey" });
			}
		});
	}, 
	
	resetCurrentData: function()
	{
		"use strict";
		this.currentData = null; 
	}
	
};

var NOTIFS = null;
if (chrome.notifications !== undefined)
{
	NOTIFS = NEW_NOTIFS;
	chrome.notifications.onClosed.addListener(function(notificationId/*, byUser*/)
	{
		"use strict";
		if (notificationId === 'deezer_control')
		{
			NOTIFS.resetCurrentData();
		}
	});
	
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
	{
		"use strict";
		if (notificationId === 'deezer_control')
		{
			NOTIFS.buttonClicked(buttonIndex);
		}
	});
	
	chrome.notifications.onClicked.addListener(function(notificationId)
	{
		"use strict";
		if (notificationId === 'deezer_control')
		{
			chrome.runtime.sendMessage({ type: 'jumpToDeezer', source: 'notif' });
		}
	});
}
