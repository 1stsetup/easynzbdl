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
 * Website: https://github.com/1stsetup/easynzbdl
 *
 * ***** BEGIN LICENSE BLOCK *****/
var Cu = Components.utils;
var Ci = Components.interfaces;
var Cc = Components.classes;

Cu.import("resource://easynzbdl/globalFunctions.js");
Cu.import("resource://interfaces/xml2jxon/mivIxml2jxon.js");

function easynzbdlGetNZB(aImdbId, aDocument)
{
	this.req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

	this.imdbId = aImdbId;
	this._document = aDocument;
	this.items = [];

	var tmp = this;

	// http://dvcs.w3.org/hg/progress/raw-file/tip/Overview.html
	// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIXMLHttpRequestEventTarget
	this.req.addEventListener("loadend", function(evt) { tmp.loadend(evt); }, false);

	let finaleImdbId = aImdbId;
	if (finaleImdbId.indexOf("tt") == 0) {
		finaleImdbId = finaleImdbId.substr(2);
	}

	let serverurl = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search.serverurl", "", true);
	if (serverurl[serverurl.length-1] != "/") {
		serverurl = serverurl + "/";
	}
	let apikey = enzbdlSafeGetCharPref(null, "extensions.1st-setup.easynzbdl.search.apikey", "", true);

	//dump("easynzbdlGetNZB.new: Going to get: "+serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1\n");
 
	this.req.open("GET", serverurl+"api?t=movie&imdbid="+finaleImdbId+"&apikey="+apikey+"&extended=1", true);
	this.req.send();
	dump("easynzbdlGetNZB.new: send GET request.\n");
}

easynzbdlGetNZB.prototype = {

	loadend: function _loadend(event)
	{
		dump("easynzbdlGetNZB.loadend\n");
		let req = this.req;

		if (this.debug) this.logInfo(": ExchangeRequest.loadend :"+event.type+", readyState:"+req.readyState+", status:"+req.status);
		if (this.debug) this.logInfo(": ExchangeRequest.loadend :"+req.responseText,2);

		//this.exchangeStatistics.addDataRead(this.currentUrl, xmlReq.responseText.length);

		if (req.readyState != 4) {
			dump("readyState < 4. THIS SHOULD NEVER HAPPEN. PLEASE REPORT.");
			return;
		}

		try {
			var newXML = new mivIxml2jxon('', 0, null);
		}
		catch(exc) { dump("easynzbdlGetNZB.loadend createInstance error:"+exc+"\n"); return;} 

		try {
			newXML.processXMLString(req.responseText, 0, null);
		}
		catch(exc) { dump("easynzbdlGetNZB.loadend processXMLString error:"+exc.name+", "+exc.message+"\n"); return;} 

		//dump("newXML:\n"+newXML.toString()+"\n");

		var items = newXML.XPath("/_default_:rss/_default_:channel/_default_:item");
		dump("items.length:"+items.length+"\n");
		if (items.length > 0) {

			var vbox = this._document.getElementById("easynzbdl-appcontent-vbox");
			for (var i=0; i<items.length; i++) {
				this.items.push(items[i].clone());
				dump("item Title:"+items[i].getTagValue("_default_:title")+"\n");
				let node_anchor = this._document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "xul:label");
				node_anchor.setAttribute("value", items[i].getTagValue("_default_:title"));
				vbox.appendChild(node_anchor);
			}
		}
		dump("easynzbdlGetNZB.loadend DONE\n");
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
		dump("easynzbdlBrowser.ondLoad\n");

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

	showDiv: function _showDiv(aId, aImdbId)
	{
		let div = this._document.getElementById(aId);
		if (div) {
			let label = this._document.getElementById("easynzbdl-appcontent-label");
			if (label) label.value = "imdbId:"+aImdbId;
			div.hidden = false;
		}
	},

	hideDiv: function _hideDiv(aId)
	{
		let div = this._document.getElementById(aId);
		if (div) {
			div.hidden = true;
		}
	},

	clearDiv: function _clearDiv(aId)
	{
		let div = this._document.getElementById(aId);
		if (div) {
			dump("We have '"+div.childNodes.length+"' childnodes\n");
			while (div.childNodes.length > 0) {
				div.removeChild( div.childNodes.item(0) );
			}

			let node_anchor = this._document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "xul:label");
			node_anchor.setAttribute("id", "easynzbdl-appcontent-label");
			div.appendChild(node_anchor);
		}
	},

	parsePage: function _parsePage(event)
	{
		dump("easynzbdlBrowser.parsePage\n");
		if (!event) return;

		if (event.target.body == null) return;
		if (event.eventPhase != 1) return;

		if (event.target["location"]) {
			dump("easynzbdlBrowser.parsePage: location:"+event.target.location+", event.eventPhase:"+event.eventPhase+"\n");

			let imdbId = this.getImdbId(event.target.location.toString());
			if (imdbId) {
				if (this._markedPages[imdbId]) return;
				if ((this._lastImdbId) && (imdbId != this._lastImdbId)) {
					this.clearDiv("easynzbdl-appcontent-vbox");
				}
				this._markedPages[imdbId] = new easynzbdlGetNZB(imdbId, this._document);
				this._lastImdbId = imdbId;
				dump("easynzbdlBrowser.parsePage: imdbId:"+imdbId+"\n");

				this.showDiv("easynzbdl-appcontent-vbox", imdbId);
				dump("easynzbdlBrowser.parsePage: shown label.\n");
				
			}
		}
	},

	getBrowserForTab: function _getBrowserForTab(aTab)
	{
		if (gBrowser) {
			dump("easynzbdlBrowser.getBrowserForTab: we have a gBrowser.\n");
			let tabBrowser = gBrowser.getBrowserForTab(aTab);
			if (tabBrowser) {
				dump("easynzbdlBrowser.getBrowserForTab: we have a tabBrowser.\n");
				return tabBrowser;
			}
		}

		return null;
	},

	onTabSelect: function _onTabSelect(event)
	{
		dump("easynzbdlBrowser.onTabSelect\n");

		let tabBrowser = this.getBrowserForTab(event.target);

		if (tabBrowser) {
			dump("easynzbdlBrowser.onTabSelect: tabBrowser.currentURI:"+tabBrowser.currentURI.spec+"\n");

			let imdbId = this.getImdbId(tabBrowser.currentURI.spec);
			if (imdbId) {
				this.showDiv("easynzbdl-appcontent-vbox", imdbId);
				dump("easynzbdlBrowser.onTabSelect: imdbId:"+imdbId+"\n");
			}
			else {
				this.hideDiv("easynzbdl-appcontent-vbox");
				dump("easynzbdlBrowser.parsePage: hidden label.\n");
			}
		}
	},

	onTabClose: function _onTabClose(event)
	{
		dump("easynzbdlBrowser.onTabClose\n");
		let tabBrowser = this.getBrowserForTab(event.target);

		let tabBrowser = this.getBrowserForTab(event.target);

		if (tabBrowser) {
			dump("easynzbdlBrowser.onTabClose: tabBrowser.currentURI:"+tabBrowser.currentURI.spec+"\n");

			let imdbId = this.getImdbId(tabBrowser.currentURI.spec);
			if (imdbId) {
				dump("easynzbdlBrowser.onTabClose: imdbId:"+imdbId+"\n");
				this.hideDiv("easynzbdl-appcontent-vbox");
				this._markedPages[imdbId] = null;
				delete this._markedPages[imdbId];
			}
		}

	},

}

var tmpEasynzbdlBrowser = new easynzbdlBrowser(document, window);
window.addEventListener("load", function () { window.removeEventListener("load",arguments.callee,false); tmpEasynzbdlBrowser.onLoad(); }, true);

