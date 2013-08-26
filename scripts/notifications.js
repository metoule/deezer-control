
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
	
	refreshNotif: function()
	{
		chrome.extension.getViews({ type: "notification" }).forEach(function(win) { win.refreshPopup(); });		
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
	buttonPrev:  { title: chrome.i18n.getMessage('playback_prev'),  iconUrl: 'imgs/large/prev.png'  },
	buttonPlay:  { title: chrome.i18n.getMessage('playback_play'),  iconUrl: 'imgs/large/play.png'  },
	buttonPause: { title: chrome.i18n.getMessage('playback_pause'), iconUrl: 'imgs/large/pause.png' },
	buttonNext:  { title: chrome.i18n.getMessage('playback_next'),  iconUrl: 'imgs/large/next.png'  },
	
	createNotif: function()
	{
		this.createUpdateNotif(chrome.notifications.create);
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
	
	refreshNotif: function()
	{
		if (this.currentTrack != null)
			this.createUpdateNotif(chrome.notifications.update);
	}, 
	
	createUpdateNotif: function(notifMethod)
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
				iconUrl: "http://cdn-images.deezer.com/images/cover/" + gNowPlayingData.dz_cover + "/80x80-000000-80-0-0.jpg",
				buttons: notifButtons,
				priority: 0
		};
		
		// don't update notification if same data
		var newData = JSON.stringify(content);
		if (newData == this.currentData)
			return;

		this.currentData = newData;
		notifMethod('deezer_control', content, function() {});
	}, 
	
	buttonClicked: function(buttonIndex)
	{
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

var NOTIFS = OLD_NOTIFS;
if (typeof webkitNotifications.createHTMLNotification === "undefined")
{
	NOTIFS = NEW_NOTIFS;
	chrome.notifications.onClosed.addListener(function(notificationId, byUser)
	{
		if (notificationId == 'deezer_control' && byUser)
			NOTIFS.resetCurrentData();
	});
	
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
	{
		if (notificationId == 'deezer_control')
			NOTIFS.buttonClicked(buttonIndex);
	});
}
