# Version 1.0.0
* Initial code for eslint plugin to require that every addEventListener in a JavaScript file has a corresponding removeEventListener.
# Version 1.0.2
* Removed console logs
# Version 1.0.3
* Fixed issue where inline eventhandler element was showing up as undefined when using 'this' in error message.
# Version 1.0.4
* Added support for events gives as a constant instead of a string. I.e document.addEventListener(Constants.SaveEvent, this.someFunction);
# Version 1.0.5
* Fixed issue where the event name was given as a constant with an underscore in the name i.e Constants.Save_Event