/*
polymorph.js
Version: 1.0.0
Author: Tagir F. Valeev <lany@ngs.ru>
License: MIT [ http://www.opensource.org/licenses/mit-license.php ]
*/

if(!Number.__name) Number.__name = "number";
if(!String.__name) String.__name = "string";
if(!Boolean.__name) Boolean.__name = "boolean";

function polymorph()
{
	var getParameterTypes = function(types, func)
	{
		var param = func.toString().match(/\((.*?)\)/)[1].split(/,\s*/);
		for(var i = 0; i < param.length; i++) param[i] = types[param[i]];
		return param;
	}
	var applyFunction = function(flist, obj, args)
	{
		for(var i=0; i<flist.length-1; i++)
		{
			var flag = true;
			for(var j=0; j<flist[i].length; j++)
			{
				if(flist[i][0][j] == undefined || args[j] == undefined || (args[j] instanceof flist[i][0][j])
					|| typeof(args[j])==flist[i][0][j].__name)
					continue;
				flag = false;
				break;
			}
			if(flag) return flist[i][1].apply(obj,args);
		}
		return flist[i][1].apply(obj,args);
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
	var isEqualParams = function(x,y)
	{
		if(x.length != y.length) return false;
		for(var i=0; i<x.length; i++) {
			if(x[i]==undefined && y[i]==undefined) continue;
			if(x[i]==y[i]) continue;
			return false;
		}
		return true;
	}
	var addFunctions = function(funcmap, args)
	{
		for(var i=0; i<args.length; i++)
		{
			var params;
			if(typeof(args[i]) == "object" && i<args.length-1 && typeof(args[i+1]) == "function")
			{
				params = getParameterTypes(args[i], args[i+1]);
				i++;
			} else if(typeof(args[i]) == "function")
			{
				params = getParameterTypes(new Object(), args[i]);
			}
			var nparam = args[i].length;
			if(funcmap[nparam] == undefined) funcmap[nparam] = [];
			// Replace existing function with the same prototype if any
			for(var j=0; j<funcmap[nparam].length; j++)
			{
				if(isEqualParams(funcmap[nparam][j][0], params))
				{
					funcmap[nparam][j][1] = args[i];
				}
			}
			// Create new one
			funcmap[nparam].push([params, args[i]]);
		}
	}
	var res = function()
	{
		return applyFunction(arguments.callee.funcmap[arguments.length], this, arguments);
	}
	res.funcmap = new Object();
	addFunctions(res.funcmap, arguments);
	res.update = function()
	{
		addFunctions(this.funcmap, arguments);
	}
	res.inherit = function()
	{
		var child = function()
		{
			return applyFunction(arguments.callee.funcmap[arguments.length], this, arguments);
		}
		child.update = res.update;
		child.inherit = res.inherit;
		child.funcmap = clone(this.funcmap);
		addFunctions(child.funcmap, arguments);
		return child;
	}
	return res;
}