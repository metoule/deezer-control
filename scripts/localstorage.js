
function FillDictWithDefaults(iDictWithRealValues, iDictWithDefaultValues)
{
	var aMyNewObject = {};
	
	if (iDictWithRealValues == null)
		iDictWithRealValues = {};

	// loop on all keys of iDictWithDefaultValues, and assign value to aMyNewObject if key not found in iDictWithRealValues
	// note: this will also remove any key in iDictWithRealValues not present in iDictWithDefaultValues
	for(var key in iDictWithDefaultValues)
	{
		if(iDictWithDefaultValues.hasOwnProperty(key))
		{
			if (iDictWithRealValues.hasOwnProperty(key))
				aMyNewObject[key] = iDictWithRealValues[key];
			else				
				aMyNewObject[key] = iDictWithDefaultValues[key];
		}
	}
	
	return aMyNewObject;
}

var LOCSTO = LOCSTO || {
	
	/*
	 * restore values will try to load values from local storage
	 */
	loadOptions: function()
	{
		this.popupStyle = this.get('popup_style') || 'large';
		
		// notifications
		// they changed from the beginning, so: 
		//   - visible = on_song_change
		//   - alwaysOn = never_hides
		this.notifications = FillDictWithDefaults(this.get('notifications'), { never: false, alwaysOn: false, visible: false, onHotKeyOnly: false, fadeAwayDelay: 3000, style: 'sideways' });
		
		// hot keys
			   this.prevHotKey =         FillDictWithDefaults(this.get('prevHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 177 });
		  this.playPauseHotKey =    FillDictWithDefaults(this.get('playPauseHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 179 });
			   this.nextHotKey =         FillDictWithDefaults(this.get('nextHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 176 });
		this.whatZatSongHotKey =  FillDictWithDefaults(this.get('whatZatSongHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 87 });
	   this.jumpToDeezerHotKey = FillDictWithDefaults(this.get('jumpToDeezerHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 74 });
	   
	   // misc options
	   this.miscOptions = FillDictWithDefaults(this.get('miscOptions'), { limitDeezerToOneTab: true });
	},
	
	/*
	 * are we in an update scenario?
	 */
	shouldWeShowNewItems: function()
	{
		this.installedVersion = this.get('installedVersion') || "0.0.0";
		var aExtensionVersion = chrome.app.getDetails().version;
		
		return /*this.installedVersion != "1.0" && */ this.installedVersion < aExtensionVersion;
	},
	
	/*
	 * store values will save values to local storage
	 */
	
	savePopupStyle: function()
	{
		this.set('popup_style', this.popupStyle);
	},
	
	saveHotKeys: function()
	{
		this.set('prevHotKey', this.prevHotKey);
		this.set('playPauseHotKey', this.playPauseHotKey);
		this.set('nextHotKey', this.nextHotKey);
		this.set('whatZatSongHotKey', this.whatZatSongHotKey);
		this.set('jumpToDeezerHotKey', this.jumpToDeezerHotKey);
	},
	
	saveNotifications: function()
	{
		this.set('notifications', this.notifications);
	}, 
	
	saveMiscOptions: function()
	{
		this.set('miscOptions', this.miscOptions);
	}, 
	
	saveInstalledVersion: function()
	{
		this.set('installedVersion', chrome.app.getDetails().version);
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

