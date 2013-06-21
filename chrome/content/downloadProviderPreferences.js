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

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://easynzbdl/globalFunctions.js");

function easynzbdlDownloadProviderPreferences(aDocument, aWindow)
{
	this._document = aDocument;
	this._window = aWindow;
}

easynzbdlDownloadProviderPreferences.prototype = {

	browseFolder: function _browseFolder() {
		const nsIFilePicker = Ci.nsIFilePicker;
		var fp = Cc["@mozilla.org/filepicker;1"]
			    .createInstance(nsIFilePicker);

		var title = "Select save folder";

		fp.init(this._window, title, nsIFilePicker.modeGetFolder);

		var ret = fp.show();

		if (ret == nsIFilePicker.returnOK) {
			//dump("[["+fp.file.path+"]]\n");
			document.getElementById("extensions.1st-setup.easynzbdl.savetofile.folder").value = fp.file.path;
			this.setFolderFromPref();
		}

	},

	setFolderFromPref: function _setFolderFromPref() {
		var logUrl = document.getElementById("easynzbdl_download_savetofile_folder_textbox");
		logUrl.value = document.getElementById("extensions.1st-setup.easynzbdl.savetofile.folder").value;
	},

}

var tmpEasynzbdlDownloadProviderPreferences = new easynzbdlDownloadProviderPreferences(document, window);

// Next is to make sure we have at least an enabled preference for search server 0. This option was introduced in version 1.0.3
enzbdlSafeGetBoolPref(null, "extensions.1st-setup.easynzbdl.search.0.enabled", true, true);
// Next is to make sure we have at least an enabled preference for sabnzbd download server. This option was introduced in version 1.0.4
enzbdlSafeGetBoolPref(null, "extensions.1st-setup.easynzbdl.download.enabled", true, true);


