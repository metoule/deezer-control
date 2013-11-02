
var OLD_NOTIFS = OLD_NOTIFS || 
{
	htmlNotification: null, 
	timeoutId: null, 
	mouseOverNotif: false, 
	
	createNotif: function(forceRedisplay)
	{
		// if notif not already visible, create it
		if (this.htmlNotification == null)
		{
			this.htmlNotification = webkitNotifications.createHTMLNotification("/popup.html?style=" + LOCSTO.notifications.style + "&notif=on");
			this.htmlNotification.show();
		} 
		// else, we already have a notif opened
		else 
		{
			// refresh content
			chrome.extension.getViews({ type: "notification" }).forEach(function(win) { win.refreshPopup(); });	
			this.resetNotifTimeout(); // remove existing timeout
		}

		// hide notification after the wanted delay
		this.startNotifTimeout();
	}, 
	
	destroyNotif: function()
	{
		if (this.htmlNotification != null) 
			this.htmlNotification.cancel(); 
		
		this.htmlNotification = null; 
		this.timeoutId = null;
	}, 
	
	resetNotifTimeout: function()
	{
		if (this.timeoutId != null)
		{
			window.clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}, 
	
	startNotifTimeout: function()
	{
		// hide notification after the wanted delay
		if (this.mouseOverNotif == false && !LOCSTO.notifications.alwaysOn)
		{
			var _this = this;
			this.timeoutId = window.setTimeout(function() { _this.destroyNotif(); }, LOCSTO.notifications.fadeAwayDelay);
		}
	}, 
	
	onMouseOverNotif: function()
	{
		this.mouseOverNotif = true;
		this.resetNotifTimeout();
	}, 
	
	onMouseOutNotif: function()
	{
		this.mouseOverNotif = false; 
		this.startNotifTimeout();
	}
	
};

var NEW_NOTIFS = NEW_NOTIFS || 
{
	currentData: null,
	buttonPrev:  { title: chrome.i18n.getMessage('playback_prev'),  iconUrl: 'imgs/notifs/prev.png'  },
	buttonPlay:  { title: chrome.i18n.getMessage('playback_play'),  iconUrl: 'imgs/notifs/play.png'  },
	buttonPause: { title: chrome.i18n.getMessage('playback_pause'), iconUrl: 'imgs/notifs/pause.png' },
	buttonNext:  { title: chrome.i18n.getMessage('playback_next'),  iconUrl: 'imgs/notifs/next.png'  },
	
	createNotif: function(forceRedisplay)
	{
		// we're only allowed two buttons: display play/pause, and next
		var notifButtons = []; 
		if (gNowPlayingData.dz_playing == 'true')
			notifButtons.push(this.buttonPause);
		else
			notifButtons.push(this.buttonPlay);		
		
		if (gNowPlayingData.dz_is_next_active == 'true')
			notifButtons.push(this.buttonNext);
		else if (gNowPlayingData.dz_is_prev_active == 'true')
			notifButtons.push(this.buttonPrev);	
		
		var content = {
				type: 'basic', 
				title:   gNowPlayingData.dz_track, 
				message: gNowPlayingData.dz_artist,
				iconUrl: 'http://cdn-images.deezer.com/images/cover/' + gNowPlayingData.dz_cover + '/80x80-000000-80-0-0.jpg',
				buttons: notifButtons,
				priority: 0
		};
		
		
		// don't update notification if same data
		var newData = JSON.stringify(content);
		if (newData == this.currentData)
			return;

		if (forceRedisplay)
		{
			this.destroyNotif(function(_this) 
			{
				_this.currentData = newData;
				chrome.notifications.create('deezer_control', content, function(notifId) {});
			});
		}
		else
		{
			this.currentData = newData;
			chrome.notifications.create('deezer_control', content, function(notifId) {});
		}
	}, 
	
	destroyNotif: function(callback)
	{
		var _this = this;
		chrome.notifications.clear('deezer_control', function(wasCleared) 
		{
			_this.resetCurrentData(); 
			if (callback)
				callback(_this); 
		});
	}, 
	
	buttonClicked: function(buttonIndex)
	{
		// workaround for https://code.google.com/p/chromium/issues/detail?id=246637
		var notifButton = JSON.parse(this.currentData).buttons[buttonIndex];
		this.destroyNotif(function(_this) 
		{
			// we use source as hotkey to ensure that when we're on mode 'on hot keys only', 
			// the notif doesn't disappear on click
			if (notifButton.title == _this.buttonPrev.title)
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'prev', source: "hotkey" });
			else if (notifButton.title == _this.buttonPlay.title)
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'play', source: "hotkey" });
			else if (notifButton.title == _this.buttonPause.title)
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'pause', source: "hotkey" });
			else if (notifButton.title == _this.buttonNext.title)
				chrome.runtime.sendMessage({ type: "controlPlayer", command: 'next',  source: "hotkey" });
		});
	}, 
	
	resetCurrentData: function()
	{
		this.currentData = null; 
	}, 
	
	resetNotifTimeout: function()
	{
		// NOP: obsolete for new notifs
	}, 
	
	startNotifTimeout: function()
	{
		// NOP: obsolete for new notifs
	}, 
	
	onMouseOverNotif: function()
	{
		// NOP: obsolete for new notifs
	}, 
	
	onMouseOutNotif: function()
	{
		// NOP: obsolete for new notifs
	}
	
};

var NOTIFS = null;

if (typeof webkitNotifications.createHTMLNotification !== "undefined")
	NOTIFS = OLD_NOTIFS;

else if (typeof chrome.notifications !== "undefined")
{
	NOTIFS = NEW_NOTIFS;
	chrome.notifications.onClosed.addListener(function(notificationId, byUser)
	{
		if (notificationId == 'deezer_control')
			NOTIFS.resetCurrentData();
	});
	
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
	{
		if (notificationId == 'deezer_control')
			NOTIFS.buttonClicked(buttonIndex);
	});
	
	chrome.notifications.onClicked.addListener(function(notificationId)
	{
		if (notificationId == 'deezer_control')
			chrome.runtime.sendMessage({ type: 'jumpToDeezer', source: 'notif' });
	});
}
