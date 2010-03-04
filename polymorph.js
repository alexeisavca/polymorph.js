/*
polymorph.js
Version: 1.0.1
Author: Tagir F. Valeev <lany@ngs.ru>
License: MIT [ http://www.opensource.org/licenses/mit-license.php ]
*/

if(!Number.__name) Number.__name = "number";
if(!String.__name) String.__name = "string";
if(!Boolean.__name) Boolean.__name = "boolean";

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
			if(arguments.callee.__fmaplite) 
				return arguments.callee.__fmaplite[arguments.length].apply(this, arguments);
			var flist = arguments.callee.__fmap[arguments.length];
			for(var i=0; i<flist.length-1; i++) {
				var flag = true;
				for(var j=0; j<flist[i].length; j++) {
					if(flist[i][0][j] == undefined || arguments[j] == undefined || (arguments[j] instanceof flist[i][0][j])
						|| typeof(arguments[j])==flist[i][0][j].__name)
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