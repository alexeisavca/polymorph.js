/*
polymorph.js
Version: 1.0.3
Author: Tagir F. Valeev <lany@ngs.ru>
License: MIT [ http://www.opensource.org/licenses/mit-license.php ]
*/

if(!Number.__name) Number.__name = "number";
if(!String.__name) String.__name = "string";
if(!Boolean.__name) Boolean.__name = "boolean";

/*
 * __fmap is an array of arrays of data and functions.
 * The first array is organized by argument length.
 * The second could really be an object, for clarity.
 *   0 is the array of argument type information,
 *   1 is the function.
 * The third is by argument index and contains the type for for the
 *   argument index of the corresponding function. 
 * 
 * [argumentCount][0][argumentIndex]
 * 
 * __fmaplite is used when there no functions have the same number of arguments.
 * Each function is mapped by its argument length.
 */

function polymorph() {
	var getParameterTypes = function(types, func) {
		var param = func.toString().match(/\((.*?)\)/)[1].split(/,\s*/);
		for(var i = 0; i < param.length; i++) param[i] = types[param[i]];
		return param;
	}
	var clone = function(obj) {
		var newObj = (obj instanceof Array) ? [] : {};
		for (i in obj) {
			if (obj[i] && typeof obj[i] == "object")
				newObj[i] = clone(obj[i])
			else
				newObj[i] = obj[i];
		}
		return newObj;
	}
	var isEqualParams = function(x,y) {
		if(x.length != y.length) return false;
		for(var i=0; i<x.length; i++) {
			if(x[i]==undefined && y[i]==undefined) continue;
			if(x[i]==y[i]) continue;
			return false;
		}
		return true;
	}
	var addFunctions = function(funcmap, args) {
		for(var i=0; i<args.length; i++) {
			var params;
			if(typeof(args[i]) == "object" && i<args.length-1 && typeof(args[i+1]) == "function") {
				params = getParameterTypes(args[i], args[i+1]);
				i++;
			}
			else if(typeof(args[i]) == "function") {
				params = getParameterTypes(new Object(), args[i]);
			}
			var nparam = args[i].length;
			if(funcmap[nparam] == undefined) funcmap[nparam] = [];
			// Replace existing function with the same prototype if any
			for(var j=0; j<funcmap[nparam].length; j++) {
				if(isEqualParams(funcmap[nparam][j][0], params)) {
					funcmap[nparam][j][1] = args[i];
				}
			}
			// Create new one
			funcmap[nparam].push([params, args[i]]);
		}
	}
	var getPolymorphFunction = function(funcmap) {
		var res = function() {
			var argLen = arguments.length;
			
			/*
			 * Check for the simple mapping (split only by argument length)
			 * Now includes a check that __fmaplit[argLen] is not undefined
			 * We could handle the error here, but it will be caught, below
			 */
			if (arguments.callee.__fmaplite && arguments.callee.__fmaplite[argLen]) 
				return arguments.callee.__fmaplite[argLen].apply(this, arguments);
			var flist = arguments.callee.__fmap[argLen];
			
			// If we don't have the correct number of arguments, stop here.
			if (flist === undefined) {
				throw new SyntaxError('Unexpected argument count');
			}
			
			for(var i=0; i<flist.length-1; i++) {
				var flag = true;
				for(var j=0; j<flist[i].length; j++) {
					var argType = flist[i][0][j];
					
					if(argType == undefined || arguments[j] == undefined || (arguments[j] instanceof argType)
						|| typeof(arguments[j])==argType.__name)
						continue;
					flag = false;
					break;
				}
				if(flag) return flist[i][1].apply(this,arguments);
			}
			return flist[i][1].apply(this,arguments);
			/*
			Work-around for using together with jquery.inherit-1.1.1.js as it expects __base in function body:
			if(... && props[this].toString().indexOf('.__base') > -1)
			Should not harm anything
			*/
			this.__base;
		}

		var flag = true;
		for(var i in funcmap) {
			if(funcmap[i].length>1) {
				flag = false;
				break;
			}
		}
		if(flag) {
			res.__fmaplite = [];
			for(var i in funcmap) {
				res.__fmaplite[i] = funcmap[i][0][1];
			}
		}
		res.__fmap = funcmap;
		res.update = function() {
			addFunctions(this.__fmap, arguments);
			if(this.__fmaplite != undefined) {
				// Flag is "only one function for each argument length"
				var flag = true;
				for(var i in this.__fmap) {
					if(this.__fmap[i].length>1) {
						flag = false;
						break;
					}
				}
				if(!flag) delete(this.__fmaplite);
			}
		}
		res.inherit = function() {
			var funcmap = clone(this.__fmap);
			addFunctions(funcmap, arguments);
			return getPolymorphFunction(funcmap);
		}
		return res;
	}
	var funcmap = [];
	addFunctions(funcmap, arguments);
	return getPolymorphFunction(funcmap);
}

module.exports = polymorph;
