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

Cu.import("resource://easynzbdl/globalFunctions.js");

function easynzbdlDownloadNZB(aImdbId, aDocument, aWindow, searchResultBox, aItem)
{
	this.imdbId = aImdbId;
	this._document = aDocument;
	this._window = aWindow;
	this.searchResultBox = searchResultBox;
	this.item = aItem;
}

easynzbdlDownloadNZB.prototype = {

	startDownload: function _startDownload(aElement)
	{
		//dump("easynzbdlDownloadNZB.startDownload\n");
		this._element = aElement;

		this._serverurl = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.serverurl", "", false);
		if (this._serverurl[this._serverurl.length-1] != "/") {
			this._serverurl = this._serverurl + "/";
		}
		this._apikey = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.apikey", "", false));
		this._username = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.username", "", false));
		this._password = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.password", "", false));

		if ((this._serverurl == "/") || ((this._apikey == "") && (this._username == ""))) {
			//dump("  Not all preferences are available. Going to open pref dialog.\n");
			alert("Not all preferences for download provider are available. Going to open pref dialog.");
			this._window.openDialog("chrome://browser/content/preferences/preferences.xul",
				"Preferences",
				"chrome,titlebar,toolbar,centerscreen,dialog,modal=yes,resizable=no",
				null); 

			this._serverurl = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.serverurl", "", false);
			if (this._serverurl[this._serverurl.length-1] != "/") {
				this._serverurl = this._serverurl + "/";
			}
			this._apikey = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.apikey", "", false));
			this._username = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.username", "", false));
			this._password = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.password", "", false));

			if ((this._serverurl == "/") ||  ((this._apikey == "") && (this._username == ""))) {
				alert("You did not enter all preferences for download provider! Aborting download.");
				this._element.setAttribute("status", "(Aborted sending NZB to SABnzbd)");
				return;
			}
		}

		// Get categories from SABnzbd
		this.req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

		var self = this;

		// http://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIXMLHttpRequestEventTarget
		this.req.addEventListener("loadend", function(evt) { self.loadend(evt); }, false);
		this.req.addEventListener("error", function(evt) { self.error(evt); }, false);

		//dump("easynzbdlGetNZB.new: Going to get: "+serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1\n");

		if (this._apikey != "") {
			this.req.open("GET", this._serverurl+"api?mode=get_cats&output=json&apikey="+this._apikey, true);
		}
		else {
			this.req.open("GET", this._serverurl+"api?mode=get_cats&output=json&ma_username="+this._username+"&ma_password="+this._password, true);
		}
		this.req.send();
		//dump("easynzbdlDownloadNZB.startDownload: send GET request.\n");
		this._element.setAttribute("status", "(Getting categories from SABnzbd)");
	},

	loadend: function _loadend(event)
	{
		//dump("easynzbdlDownloadNZB.loadend\n");
		let req = this.req;

		if (req.readyState != 4) {
			dump("readyState < 4. THIS SHOULD NEVER HAPPEN. PLEASE REPORT.");
			return;
		}

		this._element.setAttribute("status", "(Received categories from SABnzbd)");

		//dump("easynzbdlDownloadNZB.loadend: "+req.responseText+"\n");
		var answer = JSON.parse(req.responseText);
		// Let user choose category. Is for later.

		// Get categories from SABnzbd
		this.req2 = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

		var self = this;

		// http://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIXMLHttpRequestEventTarget
		this.req2.addEventListener("loadend", function(evt) { self.loadendSendToSABnzbd(evt); }, false);
		this.req2.addEventListener("error", function(evt) { self.errorSendToSABnzbd(evt); }, false);

		var nzbUrl = encodeURIComponent(this.item.getTagValue("_default_:link", ""));
		var niceName = encodeURIComponent(this.item.getTagValue("_default_:title", ""));

		//dump("easynzbdlGetNZB.new: Going to get: "+serverurl+"api?mode=addurl&name="+nzbUrl+"&nzbname="+niceName+"&apikey="+apikey+"\n");

		var category = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.download.category", "", false));
		if (category != "") {
			category = "&cat="+encodeURIComponent(category);
		}

		if (this._apikey != "") {
			this.req2.open("GET", this._serverurl+"api?mode=addurl&name="+nzbUrl+"&nzbname="+niceName+"&apikey="+this._apikey+category, true);
		}
		else {
			this.req2.open("GET", this._serverurl+"api?mode=addurl&name="+nzbUrl+"&nzbname="+niceName+"&ma_username="+this._username+"&ma_password="+this._password+category, true);
		}
		this.req2.send();
		//dump("easynzbdlDownloadNZB.loadend: send GET request.\n");
		this._element.setAttribute("status", "(Sending NZB to SABnzbd)");

	},

	error: function _error(event)
	{
		this._element.setAttribute("status", "(Error during contacting SABnzbd server)");
	},

	loadendSendToSABnzbd: function _loadendSendToSABnzbd(event)
	{
		//dump("easynzbdlDownloadNZB.loadendSendToSABnzbd\n");
		let req = this.req2;

		if (req.readyState != 4) {
			//dump("readyState < 4. THIS SHOULD NEVER HAPPEN. PLEASE REPORT.");
			return;
		}

		this._element.setAttribute("status", "(Sent NZB to SABnzbd)");

		//dump("easynzbdlDownloadNZB.loadendSendToSABnzbd: "+req.responseText+"\n");
		//var answer = JSON.parse(req.responseText);
	},

	errorSendToSABnzbd: function _errorSendToSABnzbd(event)
	{
		this._element.setAttribute("status", "(Error during contacting SABnzbd server)");
	},

	saveToFolder: function _saveToFolder(aElement)
	{
		this._element = aElement;

		this.req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

		var self = this;

		// http://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIXMLHttpRequestEventTarget
		this.req.addEventListener("loadend", function(evt) { self.loadendSaveToFolder(evt); }, false);
		this.req.addEventListener("error", function(evt) { self.errorSaveToFolder(evt); }, false);

		//dump("saveToFolder: Going to get: "+serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1\n");

		var nzbUrl = this.item.getTagValue("_default_:link", "");

		//dump("Opening:"+nzbUrl+"\n");

		this.req.open("GET", nzbUrl, true);
		this.req.send();
		//dump("easynzbdlDownloadNZB.startDownload: send GET request.\n");
		this._element.setAttribute("status", "(Downloading NZB file)");
	},

	loadendSaveToFolder: function _loadendSaveToFolder(event)
	{
		//dump("easynzbdlDownloadNZB.loadendSendToSABnzbd\n");
		let req = this.req;

		if (req.readyState != 4) {
			//dump("readyState < 4. THIS SHOULD NEVER HAPPEN. PLEASE REPORT.");
			return;
		}

		this._element.setAttribute("status", "(Downloading NZB successfull. Going to save)");

		// Save to file
		var niceName = this.item.getTagValue("_default_:title", "");
		var saveFolder = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.savetofile.folder", "", true);

		//dump("Going to save to:"+saveFolder+"/"+niceName+".nzb"+"\n");

		var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
		file.initWithPath(saveFolder);
		file.append(niceName+".nzb");

		try {
			var stream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
			stream.init(file, 0x04 | 0x08 | 0x20, 384, 0); // readwrite, create, truncate
			var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
			converter.init(stream, "UTF-8", 0, 0);
			converter.writeString(req.responseText);
			converter.close();
			this._element.setAttribute("status", "(Saved NZB file)");
		} catch(err) {
			this._element.setAttribute("status", "(Error saving NZB file)");
		}
	},

	errorSaveToFolder: function _errorSaveToFolder(event)
	{
		this._element.setAttribute("status", "(Error downloading NZB file)");
	},


}

function easynzbdlGetNZB(aImdbId, aDocument, aWindow, searchResultBox, aServerId)
{
	this.imdbId = aImdbId;
	this._document = aDocument;
	this._window = aWindow;
	this.searchResultBox = searchResultBox;

	let serverurl = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search."+aServerId+".serverurl", "", true);
	if (serverurl[serverurl.length-1] != "/") {
		serverurl = serverurl + "/";
	}
	let apikey = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search."+aServerId+".apikey", "", true));

	if ((serverurl == "/") || (apikey == "")) {
		//dump("  Not all preferences are available. Going to open pref dialog.\n");
		alert("Not all preferences for search provider are available. Going to open pref dialog.");
		this._window.openDialog("chrome://browser/content/preferences/preferences.xul",
			"Preferences",
			"chrome,titlebar,toolbar,centerscreen,dialog,modal=yes,resizable=no",
			null); 

		serverurl = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search."+aServerId+".serverurl", "", true);
		if (serverurl[serverurl.length-1] != "/") {
			serverurl = serverurl + "/";
		}
		apikey = encodeURIComponent(enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search."+aServerId+".apikey", "", true));

		if ((serverurl == "/") || (apikey == "")) {
			alert("You did not enter all preferences for search provider! Aborting search.");
			this._element.setAttribute("status", "(Aborted search for NZB files.)");
			return;
		}
	}


	this.req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

	var self = this;

	// http://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html
	// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIXMLHttpRequestEventTarget
	this.req.addEventListener("loadend", function(evt) { self.loadend(evt); }, false);
	this.req.addEventListener("error", function(evt) { self.error(evt); }, false);

	let finaleImdbId = aImdbId;
	if (finaleImdbId.indexOf("tt") == 0) {
		finaleImdbId = finaleImdbId.substr(2);
	}

	//dump("easynzbdlGetNZB.new: Going to get: "+serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1\n");
 
	this.req.open("GET", serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1", true);
	this.req.send();
	//dump("easynzbdlGetNZB.new: send GET request.\n");
	this.searchResultBox.setAttribute("status", "(Searching for NZB files)");
	this.searchResultBox.setAttribute("favicon", serverurl+"/favicon.ico");
	this.searchResultBox.setAttribute("serverurl", serverurl);
}

easynzbdlGetNZB.prototype = {

	loadend: function _loadend(event)
	{
		//dump("easynzbdlGetNZB.loadend\n");
		let req = this.req;

		//this.exchangeStatistics.addDataRead(this.currentUrl, xmlReq.responseText.length);

		if (req.readyState != 4) {
			//dump("readyState < 4. THIS SHOULD NEVER HAPPEN. PLEASE REPORT.");
			this.searchResultBox.setAttribute("status", "(Error during contacting search server)");
			return;
		}

		try {
			var newXML = Cc["@1st-setup.nl/conversion/xml2jxon;1"].createInstance(Ci.mivIxml2jxon);
		}
		catch(exc) { dump("easynzbdlGetNZB.loadend createInstance error:"+exc+"\n"); return;} 

		try {
			newXML.processXMLString(req.responseText, 0, null);
		}
		catch(exc) { dump("easynzbdlGetNZB.loadend processXMLString error:"+exc.name+", "+exc.message+"\n"); return;} 

		//dump("newXML:\n"+newXML.toString()+"\n");

		var items = newXML.XPath("/_default_:rss/_default_:channel/_default_:item");
		//dump("items.length:"+items.length+"\n");
		if (items.length > 0) {

			var vbox = this._document.getElementById("easynzbdl-appcontent-vbox");

			for (var i=0; i<items.length; i++) {
				//dump("item Title:"+items[i].getTagValue("_default_:title")+"\n");
				var nzbItem = new easynzbdlDownloadNZB(this.imdbId, this._document, this._window, this.searchResultBox, items[i]);
				this.searchResultBox.addResultItem(items[i], nzbItem);
			}
		}
		//dump("easynzbdlGetNZB.loadend DONE\n");
		if (items.length == 1) {
			this.searchResultBox.setAttribute("status", "(Found "+items.length+" result)");
		}
		else {
			this.searchResultBox.setAttribute("status", "(Found "+items.length+" results)");
		}
	},

	error: function _error(event)
	{
		this.searchResultBox.setAttribute("status", "(Error during contacting search server)");
	},
}

function easynzbdlBrowser(aDocument, aWindow)
{
	this._document = aDocument;
	this._window = aWindow;
}

easynzbdlBrowser.prototype = {

	_markedPages: [],
	_lastImdbId: null,

	onLoad: function _onLoad()
	{
		//dump("easynzbdlBrowser.ondLoad\n");

		if (typeof getBrowser == 'function') {
			var self = this
			getBrowser().addEventListener("load", function(event) { self.parsePage(event);}, true);
			if (getBrowser().tabContainer) {
				getBrowser().tabContainer.addEventListener("TabSelect", function(event) { self.onTabSelect(event);}, true);
				getBrowser().tabContainer.addEventListener("TabClose", function(event) { self.onTabClose(event);}, true);
			} 
		}
	},

	getImdbId: function _getImdbId(location)
	{
		if (location.indexOf("http://www.imdb.com/title") > -1) {
			let imdbId = location.split('/');
			imdbId = imdbId[4];
			return imdbId;
		}
		return null;
	},

	parsePage: function _parsePage(event)
	{
		//dump("easynzbdlBrowser.parsePage\n");
		if (!event) return;

		if (event.target.body == null) return;
		if (event.eventPhase != 1) return;

		if (event.target["location"]) {
			//dump("easynzbdlBrowser.parsePage: location:"+event.target.location+", event.eventPhase:"+event.eventPhase+"\n");

			let imdbId = this.getImdbId(event.target.location.toString());
			if (imdbId) {
				if (this._markedPages[imdbId]) {
					if ((this._lastImdbId) && (this._markedPages[this._lastImdbId])) {
						for each(var markedPage in this._markedPages[this._lastImdbId]) {
							markedPage.searchResultBox.hide();
						}
					}
					for each(var markedPage in this._markedPages[imdbId]) {
						markedPage.searchResultBox.show();
					}
					this._lastImdbId = imdbId;
					return;
				}

				this._markedPages[imdbId] = {};
				for (var serverId=0; serverId<3; serverId++) {
					if (enzbdlSafeGetBoolPref(null, "extensions.1st-setup.easynzbdl.search."+serverId+".enabled", false, false)) {
						var searchResultBox = this._document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "xul:easynzbdl-searchResultBox");
						searchResultBox.setAttribute("label", "EasyNZBdl: imdbid="+imdbId);
						//searchResultBox.setAttribute("maxheight", "200");
						searchResultBox.id = imdbId;
						let appcontent = this._document.getElementById("appcontent");
						appcontent.appendChild(searchResultBox);
						this._markedPages[imdbId][serverId] = { searchResultBox: searchResultBox };
						this._markedPages[imdbId][serverId]["searchObject"] = new easynzbdlGetNZB(imdbId, this._document, this._window, searchResultBox, serverId);
						//dump("easynzbdlBrowser.parsePage: imdbId:"+imdbId+", serverId:"+serverId+"\n");
					}
				}
				this._lastImdbId = imdbId;
			}
			else {
				if ((this._lastImdbId) && (this._markedPages[this._lastImdbId])) {
					for each(var markedPage in this._markedPages[this._lastImdbId]) {
						markedPage.searchResultBox.hide();
					}
					this._lastImdbId = null;
				}
			}
		}
	},

	getBrowserForTab: function _getBrowserForTab(aTab)
	{
		if (gBrowser) {
			//dump("easynzbdlBrowser.getBrowserForTab: we have a gBrowser.\n");
			let tabBrowser = gBrowser.getBrowserForTab(aTab);
			if (tabBrowser) {
				//dump("easynzbdlBrowser.getBrowserForTab: we have a tabBrowser.\n");
				return tabBrowser;
			}
		}

		return null;
	},

	onTabSelect: function _onTabSelect(event)
	{
		//dump("easynzbdlBrowser.onTabSelect\n");

		let tabBrowser = this.getBrowserForTab(event.target);

		if (tabBrowser) {
			//dump("easynzbdlBrowser.onTabSelect: tabBrowser.currentURI:"+tabBrowser.currentURI.spec+"\n");

			let imdbId = this.getImdbId(tabBrowser.currentURI.spec);

			if ((this._lastImdbId) && (this._markedPages[this._lastImdbId])) {
				for each(var markedPages in this._markedPages[this._lastImdbId]) {
					markedPages.searchResultBox.hide();
					//dump("easynzbdlBrowser.onTabSelect: hidden label. this._lastImdbId:"+this._lastImdbId+", serverId:"+serverId+"\n");
				}
			}

			if (imdbId) {
				if (this._markedPages[imdbId]) {
					for each(var markedPages in this._markedPages[imdbId]) {
						markedPages.searchResultBox.show();
						//dump("easynzbdlBrowser.onTabSelect: shown label. this._lastImdbId:"+imdbId+", serverId:"+serverId+"\n");
					}
					this._lastImdbId = imdbId;
				}
				//dump("easynzbdlBrowser.onTabSelect: imdbId:"+imdbId+"\n");
			}
		}
	},

	onTabClose: function _onTabClose(event)
	{
		//dump("easynzbdlBrowser.onTabClose\n");
		let tabBrowser = this.getBrowserForTab(event.target);

		let tabBrowser = this.getBrowserForTab(event.target);

		if (tabBrowser) {
			//dump("easynzbdlBrowser.onTabClose: tabBrowser.currentURI:"+tabBrowser.currentURI.spec+"\n");

			let imdbId = this.getImdbId(tabBrowser.currentURI.spec);
			if (imdbId) {
				//dump("easynzbdlBrowser.onTabClose: imdbId:"+imdbId+"\n");
				if (this._markedPages[imdbId]) {
					for each(var markedPage in this._markedPages[imdbId]) {
						markedPage.searchResultBox.hide();
					}
				}
				this._markedPages[imdbId] = null;
				delete this._markedPages[imdbId];
				if (imdbId == this._lastImdbId) {
					this._lastImdbId = null;
				}
			}
		}

	},

}

var tmpEasynzbdlBrowser = new easynzbdlBrowser(document, window);
window.addEventListener("load", function () { window.removeEventListener("load",arguments.callee,true); tmpEasynzbdlBrowser.onLoad(); }, true);

