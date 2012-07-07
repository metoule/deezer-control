
function FillDictWithDefaults(ioObjectToFill, iDictWithDefaultValues)
{
	if (ioObjectToFill == null)
		return iDictWithDefaultValues;

	// loop on all keys of iDictWithDefaultValues, and assign value to ioObjectToFill if key not found in ioObjectToFill
    for(var key in iDictWithDefaultValues)
    {
        if(iDictWithDefaultValues.hasOwnProperty(key) && !ioObjectToFill.hasOwnProperty(key))
        {
        	ioObjectToFill[key] = iDictWithDefaultValues[key];
        }
    }
    
    // loop on all keys in ioObjectToFill, and remove those not found in iDictWithDefaultValues
    for(var key in ioObjectToFill)
    {
        if(ioObjectToFill.hasOwnProperty(key) && !iDictWithDefaultValues.hasOwnProperty(key))
        {
        	delete ioObjectToFill[key];
        }
    }
	
	return ioObjectToFill;
}

var LOCSTO = LOCSTO || {
	
	/*
	 * restore values will try to load values from local storage
	 */
	loadOptions: function()
	{
		this.popupStyle = this.get('popup_style') || 'large';
		this.nbOpenedDeezerTabs = this.get('nbOpenedDeezerTabs') || 0;
		
		// notifications
		// they changed from the beginning, so: 
		//   - visible = on_song_change
		//   - alwaysOn = never_hides
		this.notifications = FillDictWithDefaults(this.get('notifications'), { never: false, alwaysOn: false, visible: false, onHotKeyOnly: false, fadeAwayDelay: 3000 });
		
		// hot keys
		       this.prevHotKey =        FillDictWithDefaults(this.get('prevHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 177 });
		  this.playPauseHotKey =   FillDictWithDefaults(this.get('playPauseHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 179 });
		       this.nextHotKey =        FillDictWithDefaults(this.get('nextHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 176 });
		this.whatZatSongHotKey = FillDictWithDefaults(this.get('whatZatSongHotKey'), { ctrlKey: false, altKey: true, shiftKey: false, keyCode: 87 });
	}, 
	
	/*
	 * store values will save values to local storage
	 */
	saveOptions: function()
	{
		this.set('popup_style', this.popupStyle);
		this.set('notifications', this.notifications);
		this.set('nbOpenedDeezerTabs', this.nbOpenedDeezerTabs);
		this.set('prevHotKey', this.prevHotKey);
		this.set('playPauseHotKey', this.playPauseHotKey);
		this.set('nextHotKey', this.nextHotKey);
		this.set('whatZatSongHotKey', this.whatZatSongHotKey);
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

