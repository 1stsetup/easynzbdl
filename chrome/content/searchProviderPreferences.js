<!--
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
-->

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

function easynzbdlSearchProviderPreferences(aDocument, aWindow)
{
	this._document = aDocument;
	this._window = aWindow;
}

easynzbdlSearchProviderPreferences.prototype = {
}

var tmpEasynzbdlSearchProviderPreferences = new easynzbdlSearchProviderPreferences(document, window);

