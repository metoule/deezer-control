
function fillDictWithDefaults(iDictWithRealValues, iDictWithDefaultValues)
{
	"use strict";
	var aMyNewObject = {}, key;
	
	if (iDictWithRealValues === null)
	{
		iDictWithRealValues = {};
	}

	// loop on all keys of iDictWithDefaultValues, and assign value to aMyNewObject if key not found in iDictWithRealValues
	// note: this will also remove any key in iDictWithRealValues not present in iDictWithDefaultValues
	for(key in iDictWithDefaultValues)
	{
		if(iDictWithDefaultValues.hasOwnProperty(key))
		{
			if (iDictWithRealValues.hasOwnProperty(key))
			{
				aMyNewObject[key] = iDictWithRealValues[key];
			} 
			else
			{
				aMyNewObject[key] = iDictWithDefaultValues[key];
			}
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
var Version = function Version(strVersion)
{
	"use strict";
	var regexS = "(\\d+)(\\.(\\d+))?(\\.(\\d+))?",
	    regex = new RegExp(regexS),
	    results = regex.exec(strVersion);
	
	// if no match, default to version 0.0.0
	if (results === null)
	{
		results = regex.exec("0.0.0");
	}
	
	this.major = parseInt(results[1] || 0, 10);
	this.minor = parseInt(results[3] || 0, 10);
	this.rev   = parseInt(results[5] || 0, 10);
};

Version.prototype.toString = function() 
{ 
	"use strict";
	return this.major + "." + this.minor + "." + this.rev; 
};

// returns -1 if this < otherVersion, 0 if this == otherVersion, and +1 if otherVersion < this
Version.prototype.compare = function(otherVersion)
{
	"use strict";
	if (this.major !== otherVersion.major)
	{
		return this.major - otherVersion.major;
	}

	if (this.minor !== otherVersion.minor)
	{
		return this.minor - otherVersion.minor;
	}
	
	return this.rev - otherVersion.rev;
};


//------------------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------------------
var LOCSTO = LOCSTO || {
	
	/*
	 * restore values will try to load values from local storage
	 */
	loadOptions: function()
	{
		"use strict";
		this.popupStyle = this.get('popup_style') || 'large';
		
		// notifications
		this.notifications = fillDictWithDefaults(this.get('notifications'), { never: true, neverHides: false, onSongChange: false, onHotKeyOnly: false });
		
		// hot keys
				this.prevHotKey =		 fillDictWithDefaults(this.get('prevHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 177 });
		   this.playPauseHotKey =	fillDictWithDefaults(this.get('playPauseHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 179 });
		  		this.nextHotKey =		 fillDictWithDefaults(this.get('nextHotKey'), { ctrlKey: false, altKey: false, shiftKey: false, keyCode: 176 });
		 this.whatZatSongHotKey =  fillDictWithDefaults(this.get('whatZatSongHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 87  });
		this.jumpToDeezerHotKey = fillDictWithDefaults(this.get('jumpToDeezerHotKey'), { ctrlKey: false, altKey: true,  shiftKey: false, keyCode: 74  });

	   // misc options
	   this.miscOptions = fillDictWithDefaults(this.get('miscOptions'), { limitDeezerToOneTab: true });
	   
	   // new options to show the user
	   this.newOptionsToShow = this.get('newOptionsToShow') || false;
	   
	   // set global variables
	   COVER_SIZE = COVER_SIZES[this.popupStyle];
	},

	loadSession: function()
	{		   
	   // session data, needed for event page reload
	   this.session = fillDictWithDefaults(this.get('session'), { deezerData: null, jumpBackToActiveTab: { windowsId: 0, tabId: 0 }, notifData: null });
	},
	
	updateModel: function()
	{
		"use strict";
		var installedVersion = new Version(this.get('installedVersion')), 
			extensionVersion = new Version(chrome.app.getDetails().version);
		
		// new in version 1.9
		//  * keyCode for hotkeys are integers rather than strings
		//  * renamed notifications keys
		//  * removed notifs fade away delay and notifs style (irrelevant with the new notifs)
		if (installedVersion.compare(new Version("1.9")) < 0)
		{
			this.prevHotKey.keyCode 		= parseInt(this.prevHotKey.keyCode, 10);
			this.playPauseHotKey.keyCode 	= parseInt(this.playPauseHotKey.keyCode, 10);
			this.nextHotKey.keyCode 		= parseInt(this.nextHotKey.keyCode, 10);
			this.whatZatSongHotKey.keyCode 	= parseInt(this.whatZatSongHotKey.keyCode, 10);
			this.jumpToDeezerHotKey.keyCode = parseInt(this.jumpToDeezerHotKey.keyCode, 10);
			this.saveHotKeys();
			
			this.notifications = fillDictWithDefaults(this.get('notifications'), { never: true, alwaysOn: false, visible: false, onHotKeyOnly: false });
			this.notifications.neverHides = this.notifications.alwaysOn;
			this.notifications.onSongChange = this.notifications.visible;
			delete this.notifications.alwaysOn;
			delete this.notifications.visible;
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
		"use strict";
		this.set('popup_style', this.popupStyle);
	},
	
	saveHotKeys: function()
	{
		"use strict";
		this.set('prevHotKey', this.prevHotKey);
		this.set('playPauseHotKey', this.playPauseHotKey);
		this.set('nextHotKey', this.nextHotKey);
		this.set('whatZatSongHotKey', this.whatZatSongHotKey);
		this.set('jumpToDeezerHotKey', this.jumpToDeezerHotKey);
	},
	
	saveNotifications: function()
	{
		"use strict";
		this.set('notifications', this.notifications);
	}, 
	
	saveMiscOptions: function()
	{
		"use strict";
		this.set('miscOptions', this.miscOptions);
	}, 
	
	saveNewOptionsToShow: function()
	{
		"use strict";
		this.set('newOptionsToShow', this.newOptionsToShow);
	}, 
	
	saveSession: function()
	{
		"use strict";
		this.set('session', this.session);
	}, 
	
	/*
	 * generic methods
	 */
	
	set : function(iKey, iValue) 
	{
		"use strict";
		try 
		{
			LOCSTO.remove(iKey);
			window.localStorage.setItem(iKey, JSON.stringify(iValue));
		} catch (ignore) {}
	},
	
	get : function(iKey) 
	{
		"use strict";
		var aLocalValue = window.localStorage.getItem(iKey);
		try {
			return JSON.parse(aLocalValue);
		} catch (e) {
			return aLocalValue;
		}
	},
	
	remove : function(iKey) 
	{
		"use strict";
		return window.localStorage.removeItem(iKey);
	},
	
	clear : function() 
	{
		"use strict";
		window.localStorage.clear();
	}
};
LOCSTO.loadOptions();
LOCSTO.loadSession();

