
var LOCSTO = LOCSTO || {
	
	/*
	 * restore values will try to load values from local storage
	 */
	loadOptions: function()
	{
		this.popupStyle = this.get('popup_style');
		this.notifications = this.get('notifications') || {};
				
		/*
		 * set default values here
		 */
		this.popupStyle = this.popupStyle || 'large';
		
		this.notifications.visible = this.notifications.visible == null ? true : this.notifications.visible;
		this.notifications.alwaysOn = this.notifications.alwaysOn == null ? false : this.notifications.alwaysOn;
		this.notifications.fadeAwayDelay = this.notifications.fadeAwayDelay || 3000;		
	}, 
	
	/*
	 * store values will save values to local storage
	 */
	saveOptions: function()
	{
		this.set('popup_style', this.popupStyle);
		this.set('notifications', this.notifications);
	}, 
	
	/*
	 * generic methods
	 */
	set : function(iKey, iValue) {
		try 
		{
			LOCSTO.remove(iKey);
			window.localStorage.setItem(iKey, JSON.stringify(iValue));
		} catch (e) {}
	},
	get : function(iKey) {
		var aLocalValue = window.localStorage.getItem(iKey);
		try {
			return JSON.parse(aLocalValue);
		} catch (e) {
			return aLocalValue;
		}
	},
	remove : function(iKey) {
		return window.localStorage.removeItem(iKey);
	},
	clear : function() {
		window.localStorage.clear();
	}
};
LOCSTO.loadOptions();