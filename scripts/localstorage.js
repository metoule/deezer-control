
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


var COVER_SIZES = { large: '250x250', small: '120x120', sideways: '80x80', line: '25x25' };
var COVER_SIZE = COVER_SIZES.large;
var COVER_SIZE_NOTIFS = COVER_SIZES.sideways;

//------------------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------------------
function Version(strVersion)
{
	var regexS = "(\\d+)(\\.(\\d+))?(\\.(\\d+))?",
	    regex = new RegExp(regexS),
	    results = regex.exec(strVersion);
	
	// if no match, default to version 0.0.0
	if (results === null)
		results = regex.exec("0.0.0");

	this.major = parseInt(results[1] || 0);
	this.minor = parseInt(results[3] || 0);
	this.rev   = parseInt(results[5] || 0);
}

Version.prototype.toString = function() { return this.major + "." + this.minor + "." + this.rev; }

// returns -1 if this < otherVersion, 0 if this == otherVersion, and +1 if otherVersion < this
Version.prototype.compare = function(otherVersion)
{
	if (this.major !== otherVersion.major)
		return this.major - otherVersion.major;

	if (this.minor !== otherVersion.minor)
		return this.minor - otherVersion.minor;
	
	return this.rev - otherVersion.rev;
}


//------------------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------------------
var LOCSTO = LOCSTO || {
	
	/*
	 * restore values will try to load values from local storage
	 */
	loadOptions: function()
	{
		this.popupStyle = this.get('popup_style') || 'large';
		
		// notifications
		this.notifications = FillDictWithDefaults(this.get('notifications'), { never: true, neverHides: false, onSongChange: false, onHotKeyOnly: false, fadeAwayDelay: 3000, style: 'sideways' });
		
		// hot keys
				this.prevHotKey =		 FillDictWithDefaults(this.get('prevHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 177 });
		   this.playPauseHotKey =	FillDictWithDefaults(this.get('playPauseHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 179 });
		  		this.nextHotKey =		 FillDictWithDefaults(this.get('nextHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 176 });
		 this.whatZatSongHotKey =  FillDictWithDefaults(this.get('whatZatSongHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 87  });
		this.jumpToDeezerHotKey = FillDictWithDefaults(this.get('jumpToDeezerHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 74  });

	   // misc options
	   this.miscOptions = FillDictWithDefaults(this.get('miscOptions'), { limitDeezerToOneTab: true });
	   
	   // new options to show the user
	   this.newOptionsToShow = this.get('newOptionsToShow') || false;
	   
	   // set global variables
	   COVER_SIZE = COVER_SIZES[this.popupStyle];
	   COVER_SIZE_NOTIFS = COVER_SIZES[this.notifications.style];
	},
	
	updateModel: function()
	{
		var installedVersion = new Version(this.get('installedVersion')), 
			extensionVersion = new Version(chrome.app.getDetails().version);
		
		// new in version 1.9
		//  * keyCode for hotkeys are integers rather than strings
		//  * renamed notifications keys
		if (installedVersion.compare(new Version("1.9")) < 0)
		{
			this.prevHotKey.keyCode 		= parseInt(this.prevHotKey.keyCode);
			this.playPauseHotKey.keyCode 	= parseInt(this.playPauseHotKey.keyCode);
			this.nextHotKey.keyCode 		= parseInt(this.nextHotKey.keyCode);
			this.whatZatSongHotKey.keyCode 	= parseInt(this.whatZatSongHotKey.keyCode);
			this.jumpToDeezerHotKey.keyCode = parseInt(this.jumpToDeezerHotKey.keyCode);
			this.saveHotKeys();
			
			this.notifications = FillDictWithDefaults(this.get('notifications'), { never: true, alwaysOn: false, visible: false, onHotKeyOnly: false, fadeAwayDelay: 3000, style: 'sideways' });
			this.notifications.onSongChange = this.notifications.visible;
			this.notifications.neverHides = this.notifications.alwaysOn;
			delete this.notifications.visible;
			delete this.notifications.alwaysOn;
			this.saveNotifications();
			
			// new options to show in 1.9
			this.newOptionsToShow = true;
			this.saveNewOptionsToShow();
		}
		
		// model update finished, store newly installed version
		this.set('installedVersion', extensionVersion.toString());
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
	
	saveNewOptionsToShow: function()
	{
		this.set('newOptionsToShow', this.newOptionsToShow);
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

