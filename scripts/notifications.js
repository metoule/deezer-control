
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
		
		newData = JSON.stringify(content);

		if (forceRedisplay === true)
		{
			this.destroyNotif(function(me) 
			{
				me.currentData = newData;
				chrome.notifications.create('deezer_control', content, function(/*notifId*/) {/*NOP*/});
			});
		}
		else
		{
			// don't update notification if same data
			if (newData === this.currentData)
			{
				return;	
			}
			
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
		
		var notifButton = JSON.parse(this.currentData).buttons[buttonIndex];
		if (notifButton.title === this.buttonPrev.title)
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'prev', source: "notif" });
		}
		else if (notifButton.title === this.buttonPlay.title)
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'play', source: "notif" });
		}
		else if (notifButton.title === this.buttonPause.title)
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'pause', source: "notif" });
		}
		else if (notifButton.title === this.buttonNext.title)
		{
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'next',  source: "notif" });
		}
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
