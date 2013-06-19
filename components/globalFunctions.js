/* ***** BEGIN LICENSE BLOCK *****
 * Version: GPL 3.0
 *
 * The contents of this file are subject to the General Public License
 * 3.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * ## Easy NZB Download.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.easynzbdl.com/
 *
 * ***** BEGIN LICENSE BLOCK *****/
var Cu = Components.utils;
var Ci = Components.interfaces;
var Cc = Components.classes;

var EXPORTED_SYMBOLS = ["enzbdlGetBranch", "enzbdlSafeGetCharPref", "enzbdlSafeGetBoolPref", "enzbdlSafeGetIntPref"];

function enzbdlGetBranch(aName)
{
	var lBranche = "";
	var lName = "";
	var lastIndexOf = aName.lastIndexOf(".");
	if (lastIndexOf > -1) {
		lBranche = aName.substr(0,lastIndexOf+1);
		lName = aName.substr(lastIndexOf+1); 
	}
	else {
		lName = aName;
	}

	return { branch: Cc["@mozilla.org/preferences-service;1"]
	                    .getService(Ci.nsIPrefService)
			    .getBranch(lBranche),
		   name: lName };
}

function enzbdlSafeGetCharPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
{
	if (!aBranch) {
		var realBranche = enzbdlGetBranch(aName);
		if (!realBranche.branch) {
			return aDefaultValue;
		}
		var aBranch = realBranche.branch;
		var aName = realBranche.name;
	}

	if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

	try {
		return aBranch.getCharPref(aName);
	}
	catch(err) {
		if (aCreateWhenNotAvailable) { 
			try {
				aBranch.setCharPref(aName, aDefaultValue); 
			}
			catch(er) {
				aBranch.deleteBranch(aName);
				aBranch.setCharPref(aName, aDefaultValue); 
			}
		}
		return aDefaultValue;
	}
}

function enzbdlSafeGetBoolPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
{
	if (!aBranch) {
		var realBranche = enzbdlGetBranch(aName);
		if (!realBranche.branch) {
			return aDefaultValue;
		}
		var aBranch = realBranche.branch;
		var aName = realBranche.name;
	}

	if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

	try {
		return aBranch.getBoolPref(aName);
	}
	catch(err) {
		if (aCreateWhenNotAvailable) { 
			try {
				aBranch.setBoolPref(aName, aDefaultValue); 
			}
			catch(er) {
				aBranch.deleteBranch(aName);
				aBranch.setBoolPref(aName, aDefaultValue); 
			}
		}
		return aDefaultValue;
	}
}

function enzbdlSafeGetIntPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
{
	if (!aBranch) {
		var realBranche = enzbdlGetBranch(aName);
		if (!realBranche.branch) {
			return aDefaultValue;
		}
		var aBranch = realBranche.branch;
		var aName = realBranche.name;
	}

	if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

	try {
		return aBranch.getIntPref(aName);
	}
	catch(err) {
		if (aCreateWhenNotAvailable) { 
			try {
				aBranch.setIntPref(aName, aDefaultValue); 
			}
			catch(er) {
				aBranch.deleteBranch(aName);
				aBranch.setIntPref(aName, aDefaultValue); 
			}
		}
		return aDefaultValue;
	}
}

