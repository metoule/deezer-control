
var OLD_NOTIFS = OLD_NOTIFS || {
	
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

var NEW_NOTIFS = NEW_NOTIFS || {

	optionsPageSection: 'notifications_new', 
	
	createNotif: function()
	{
	}, 
	
	destroyNotif: function()
	{
	}, 
	
	refreshNotif: function()
	{
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


var NOTIFS = webkitNotifications.createHTMLNotification === "undefined" ? NEW_NOTIFS : OLD_NOTIFS;
