
var OLD_NOTIFS = OLD_NOTIFS || 
{
	gNotification: null, 
	gNotificationTimeoutId: null, 
	gMouseOverNotif: false, 
	optionsPageSection: 'notifications', 
	
	createNotif: function()
	{
		// if notif not already visible, create it
		if (this.gNotification == null)
		{
			this.gNotification = webkitNotifications.createHTMLNotification("/popup.html?style=" + LOCSTO.notifications.style + "&notif=on");
			this.gNotification.show();
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
		if (this.gNotification != null) 
			this.gNotification.cancel(); 
		
		this.gNotification = null; 
		this.gNotificationTimeoutId = null;
	}, 
	
	refreshNotif: function()
	{
		chrome.extension.getViews({ type: "notification" }).forEach(function(win) { win.refreshPopup(); });		
	}, 
	
	resetNotifTimeout: function()
	{
		if (this.gNotificationTimeoutId != null)
		{
			window.clearTimeout(this.gNotificationTimeoutId);
			this.gNotificationTimeoutId = null;
		}
	}, 
	
	startNotifTimeout: function()
	{
		// hide notification after the wanted delay
		if (this.gMouseOverNotif == false && !LOCSTO.notifications.alwaysOn)
		{
			var _this = this;
			this.gNotificationTimeoutId = window.setTimeout(function() { _this.destroyNotif(); }, LOCSTO.notifications.fadeAwayDelay);
		}
	}, 
	
	onMouseOverNotif: function()
	{
		this.gMouseOverNotif = true;  
		this.resetNotifTimeout();
	}, 
	
	onMouseOutNotif: function()
	{
		this.gMouseOverNotif = false; 
		this.startNotifTimeout();
	}
	
};

var NEW_NOTIFS = NEW_NOTIFS || 
{
	optionsPageSection: 'notifications',
	currentTrack: null, 
	
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
				_this.currentTrack = null; 
		}); 
	}, 
	
	refreshNotif: function()
	{
		if (this.currentTrack != null)
			this.createUpdateNotif(chrome.notifications.update);
	}, 
	
	createUpdateNotif: function(notifMethod)
	{
		var aNowPlayingData = chrome.extension.getBackgroundPage().gNowPlayingData;
		var content = {
				type: 'basic', 
				title:   aNowPlayingData.dz_track, 
				message: aNowPlayingData.dz_artist,
				iconUrl: "http://cdn-images.deezer.com/images/cover/" + aNowPlayingData.dz_cover + "/80x80-000000-80-0-0.jpg",
				buttons: null,
				priority: 0
		};
		
		// don't update notification if it's the same track
		var newTrack = content.message + '-' + content.title;
		if (newTrack == this.currentTrack)
			return;

		var _this = this;
        notifMethod('deezer_control', content, function() { _this.currentTrack = newTrack; });
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
		if (notificationId == 'deezer_control')
			NOTIFS.currentTrack = null;
	});
}
