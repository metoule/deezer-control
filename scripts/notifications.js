
var OLD_NOTIFS = OLD_NOTIFS || 
{
	htmlNotification: null, 
	timeoutId: null, 
	mouseOverNotif: false, 
	
	createNotif: function()
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
	
	createNotif: function()
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

		this.currentData = newData;
		chrome.notifications.create('deezer_control', content, function(notifId) {});
	}, 
	
	destroyNotif: function()
	{
		var _this = this;
		chrome.notifications.clear('deezer_control', function(wasCleared) 
		{ 
			if (wasCleared)
				_this.resetCurrentData(); 
		}); 
	}, 
	
	buttonClicked: function(buttonIndex)
	{
		// workaround for https://code.google.com/p/chromium/issues/detail?id=246637
		this.destroyNotif();
		
		var notifButton = JSON.parse(this.currentData).buttons[buttonIndex];
		if (notifButton.title == this.buttonPrev.title)
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'prev', source: "popup" });
		else if (notifButton.title == this.buttonPlay.title)
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'play', source: "popup" });
		else if (notifButton.title == this.buttonPause.title)
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'pause', source: "popup" });
		else if (notifButton.title == this.buttonNext.title)
			chrome.runtime.sendMessage({ type: "controlPlayer", command: 'next',  source: "popup" });
	}, 
	
	resetCurrentData: function()
	{
		this.currentData = null; 
	}, 
	
	resetNotifTimeout: function()
	{
	}, 
	
	startNotifTimeout: function()
	{
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
