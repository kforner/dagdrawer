/*

 Package: utils

Useful Javascript functions and methods


*/

// ==============================================
// Group: Debug
// You can use the directy the following firebug log functions from the console API (see <http://getfirebug.com/wiki/index.php/Console_API> ):
// "log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
//    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"


// functions from firebug console API
//var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
//"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

//var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
//             "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

function nothing() {}
var log = nothing, debug = nothing, assert = nothing, info = nothing, error = nothing, warn = nothing;

if ( window.console && window.console.firebug ) {
	log = console.log;
	debug = console.debug;
	info = console.info;
	warn = console.warn;
	error = console.warn;
	assert = console.assert;
}


//function define_function(fun) {
//	window[fun] = function() {
//		if (window.console && window.console.firebug) {
//			return console[fun].apply(this||console, arguments);
//		}
//		return "";
//	}
//}
//
//for (var i = 0; i < names.length; ++i) {
//	define_function(names[i]);
//}




//==============================================
//Group: Network related

/*
 * Function: post_to_url
 *
 * open a URL with POST or GET arguments
 *
 * code taken form here: <http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit/133997#133997>
 *
 *
 * 	Parameters:
 * 		url - the URL to open : string
 * 		params - the parameters for the URL to open : hash
 * 		method - [post] the method to use, "get" or "post" : string
 *
 */
function post_to_url(url, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", url);

    for(var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);

        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);    // Not entirely sure if this is necessary
    form.submit();
}

/**
* Function: cloneObject
*
 * clone an object, see <http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object>
 *
 * N.B:
 *  - Do not handle cyclic references !!!!!
 *  - do not clone instances !
 *
 * 	Params:
 *	 		obj - the object (i.e hash) to clone
 *
 * Return:
 * 	the cloned object
 */
function cloneObject(obj) {
	if ( obj == undefined)
		return;
    var clone = {};
    for(var i in obj) {
        if(typeof(obj[i])=="object")
            clone[i] = cloneObject(obj[i]);
        else
            clone[i] = obj[i];
    }
    return clone;
}


//==============================================
//Group: Hash related
//


//
//function _mergeIn(dest,source) {
//    if(source && dest  ) {
//        for(var p in source) {
//        	var v = source[p];
//        	if (typeof v == 'object') {
//        		if (typeof dest[p] == "undefined")
//        			dest[p] = isArray(v) ? [] : {};
//        		_mergeIn(dest[p], source[p]);
//        	} else { // override
//        		dest[p] = source[p]
//        	}
//        }
//    }
//};

///**
//* Method: mergeIn
//*
// * recursively merge the properties of an object into the current object by overriding
// * the already defined properties. Useful to add user settings to default settings for instance
// *
// * 		Params:
// *	 		source - the source to merge from : object
// *
// *  Author:
// *  	Karl Forner
// */
//
//function mergeIn(dest, source) {
//	 _mergeIn(dest, source);
//};

///**
//* Function: computeSettings
//*
// * compute some settings by merging user supplied settings and default settings
// * User supplied settings will override default settings.
// *
// * 		Params:
// *	 		settings - the user supplied settings : object
// *			defaults - the default settings : object
// *
// *		Return:
// *			the computed settings : object
// *
// *  Author:
// *  	Karl Forner
// */
//function computeSettings(settings, defaults) {
//	var res = {};
//	mergeIn(res, defaults);
//	mergeIn(res, settings);
//	return res;
//}


// ==============================================
// Group: Array related
//  useful array prototypes, most  borrowed here : <http://www.hunlock.com/blogs/Mastering_Javascript_Arrays>
//


///*
//Function: isArray
//
//tells if the object is an Array
//
//	Parameters:
//		object - the object to test : object
//
//	Return:
//		boolean
//
// */
//
//function isArray(testObject) {
//    return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
//}

/*
Function: getPropertiesValues

return all the values of the object as an array
dies if object is not an object

Parameters:
	object - the object

Return:
	the values - array

 */
function getPropertiesValues(object) {
	if ( object == undefined )
		return [];
	if ( ! Ext.isObject( object) )
		throw new Error("Must give an object !");
	var l = [];
	for (var i in object)
		l.push( object[i]);
	return l;
}


/*
 * Method: clone
 *
 * clone an array
 *
 * 	Parameters:
 * 		array - the array to clone
 *
 * Return:
 * 		the cloned array
 *
 */
Array.prototype.clone = function() {
	return this.slice(0);
}

/*
 * Method: Array.pushArray
 *
 * push an entire array into the array
 *
 * 	Parameters:
 * 		array - the array to push
 *
 */
Array.prototype.pushArray = function(array) {
	if ( ! Ext.isArray( array) )
		throw new Error("Must give an array !");
	for (var i = 0; i < array.length; i++)
		this.push(array[i]);
}

/*
* Method: Array.sortNum
*
* return a numerically sorted Array
*
*/
Array.prototype.sortNum = function() {
	return this.clone().sort( function(a, b) {
		return a - b;
	});
}

/*
* Method: Array.find
*
* search an array for matching elements using equality on a string or a search function
*
* Params:
* 	searchStr - the search criterium : string | function
*
* Return:
* 	matching elements - array
*
*/
// TODO: test it
Array.prototype.find = function(searchStr) {
	var returnArray = false;
	for (i = 0; i < this.length; i++) {
		if (typeof (searchStr) == 'function') {
			if (searchStr.test(this[i])) {
				if (!returnArray) {
					returnArray = []
				}
				returnArray.push(i);
			}
		} else {
			if (this[i] === searchStr) {
				if (!returnArray) {
					returnArray = []
				}
				returnArray.push(i);
			}
		}
	}
	return returnArray;
}

/*
* Method: Array.map
*
* apply a transformation on an array
*
* Params:
* 	fun - the transformation function : function
*
* Return:
* 	the transformed elements - array
*
*
* This prototype is provided by the Mozilla foundation and
* is distributed under the MIT license.
* http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
*/

// TODO: test it or use Ext.each instead
if (!Array.prototype.map) {
	Array.prototype.map = function(fun /* , thisp */) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();

		var res = new Array(len);
		var thisp = arguments[1];
		for ( var i = 0; i < len; i++) {
			if (i in this)
				res[i] = fun.call(thisp, this[i], i, this);
		}

		return res;
	};
}

/*
* Method: Array.some
*
* The some() method will pass each element of the Array through the supplied function
*  until true has been returned. If the function returns true some will in turn
*  return true. If the entire array has been traversed and no true condition
*  was found then some() will return false.
*
* Params:
* 	fun - the test function : function
*
* Return:
* 	some - boolean
*
*
* This prototype is provided by the Mozilla foundation and
* is distributed under the MIT license.
* http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
*/

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
//TODO: test it o
if (!Array.prototype.some) {
	Array.prototype.some = function(fun /* , thisp */) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();

		var thisp = arguments[1];
		for ( var i = 0; i < len; i++) {
			if (i in this && fun.call(thisp, this[i], i, this))
				return true;
		}

		return false;
	};
}

/*
* Method: Array.filter
*
* Filter creates a new Array of items which evaluate to true in the supplied function. In the Array.every() method, we tested if the entire Array was composed of Numbers.
* In Array.filter() we can extract all the numbers, creating a new Array in the process.
*  was found then some() will return false.
*
* Params:
* 	fun - the test function : function
*
* Return:
* 	filtered - Array
*
*
* This prototype is provided by the Mozilla foundation and
* is distributed under the MIT license.
* http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
*/

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license

if (!Array.prototype.filter)
{
Array.prototype.filter = function(fun /*, thisp*/)
{
  var len = this.length;
  if (typeof fun != "function")
    throw new TypeError();

  var res = new Array();
  var thisp = arguments[1];
  for (var i = 0; i < len; i++)
  {
    if (i in this)
    {
      var val = this[i]; // in case fun mutates this
      if (fun.call(thisp, val, i, this))
        res.push(val);
    }
  }

  return res;
};
}

/*
* Method: Array.forEach
*
* This is an odd little method.
* All it does is pass each element of the Array to the passed function.
* It ignores any results from the function and it returns nothing itself.
* It will pass all the Array contents through the function of your choice
* but the Array itself will not be affected and it will return nothing by itself.
*
* Params:
* 	fun - the function to apply: function
*
* Return:
* 	nothing
*
*
* This prototype is provided by the Mozilla foundation and
* is distributed under the MIT license.
* http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
*/

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license

if (!Array.prototype.forEach)
{
Array.prototype.forEach = function(fun /*, thisp*/)
{
  var len = this.length;
  if (typeof fun != "function")
    throw new TypeError();

  var thisp = arguments[1];
  for (var i = 0; i < len; i++)
  {
    if (i in this)
      fun.call(thisp, this[i], i, this);
  }
};
}

/*
*
* Method: Array.reduce
*
* Apply a function against an accumulator and each value of the array (from left-to-right) as to reduce it to a single value.
* See <http://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/Reduce>
*
* Params:
* 	fun - the function to apply: function
*
* Return:
* 	a value
*
*
* This prototype is provided by the Mozilla foundation and
* is distributed under the MIT license.
* http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
*/


if (!Array.prototype.reduce)
{
  Array.prototype.reduce = function(fun /*, initial*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var i = 0;
    if (arguments.length >= 2)
    {
      var rv = arguments[1];
    }
    else
    {
      do
      {
        if (i in this)
        {
          rv = this[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len)
          throw new TypeError();
      }
      while (true);
    }

    for (; i < len; i++)
    {
      if (i in this)
        rv = fun.call(null, rv, this[i], i, this);
    }

    return rv;
  };
}



