// INIT
var path = window.location.pathname,
    pathToPage = {"/": "home",
                  "/status": "status",
                  "/myprofile": "profile",
                  "/mybets": "bets",
                  "/match": "match"},
    pageType = pathToPage[path] || "unknown",
    itemsAreReturns = false,
    autoBetting = false,
    closeHook = function(){
    		if (autoBetting) {
    			return "Closing the page will disable auto-betting."
    		}
    	},
    lastRequest,
    autobetElement;

// INIT
if (pageType === "match")
	init_match_page();

// don't clutter the global scope with temporary variables
(function(){
	// create the (yet empty) autobet element, 
	// so we don't have to every time autobet is enabled
	autobetElement = document.createElement("div");
	autobetElement.className = "autobet-indicator";

	var header = document.createElement("p"),
	    container = document.createElement("div");

	container.className = "item-container";
	header.className = "header";
	header.innerHTML = "Currently auto-betting:";

	autobetElement.appendChild(header);
	autobetElement.appendChild(container);
	
	autobetElement.style.display = "none";

	document.body.appendChild(autobetElement);
})();


/**
 * Sets up hooks for the match page
 */
function init_match_page() {
	if (document.getElementById("placebut")) {
		var match = /=([0-9]+)/.exec(window.location.search)[1],
			tlss = document.getElementById("placebut").getAttribute("onclick").match(/New\('[0-9]+', '([0-9A-Za-z]+)/)[1];
		
		// hook into tab clicks, so we can check if items are returns or from inventory
		document.querySelectorAll(".tab")[0].addEventListener("click", function(){itemsAreReturns = false});
		document.querySelectorAll(".tab")[1].addEventListener("click", function(){itemsAreReturns = true});

		// replace "Place Bet" button, to remove event listeners, and listen to clicks
		var oldBtn = document.getElementById("placebut"),
		    newBtn = document.createElement("a");

		// manually clone oldBtn, since the event listener resides in onclick attribute
		newBtn.className = oldBtn.className;
		newBtn.innerHTML = oldBtn.innerHTML;
		newBtn.id = oldBtn.id;
		newBtn.style = oldBtn.style;
		newBtn.addEventListener("click", (function(match,tlss){return function(){placeBetNew_overwrite(match,tlss)}})(match,tlss));

		// replace
		oldBtn.parentNode.appendChild(newBtn);
		oldBtn.parentNode.removeChild(oldBtn);
	}
}

/**
 * Enables/disables auto-rebetting of items, after bots fail
 * @param {boolean} on - set to true if turning on, false if turning off
 */
function set_autobet(on) {
	// make sure user is warned before closing the page
	autoBetting = on;
	if (on) {
		window.onbeforeunload = closeHook;
		
		// TODO: extract items from lastRequest, instead of DOM

		// add items to autobet element
		var itemElms = document.querySelectorAll(".betpoll .left .item"),
		    container = document.querySelector(".autobet-indicator .item-container");
		
		document.querySelector(".autobet-indicator").style.display = "block";

		// move items over
		for (var i = 0; i < itemElms.length; i++) {
			var item = itemElms[i].cloneNode(true),
			    del = item.querySelectorAll(".name a");

			item.setAttribute("onclick", "");
			
			// remove links from tooltip (as they break everything)
			for (var j = 0; j < del.length; j++) {
				del[j].parentNode.removeChild(del[j]);
			}

			container.appendChild(item);
		}
	} else {
		window.onbeforeunload = function(){};

		// remove all items from autobet element
		var container = document.querySelector(".autobet-indicator .item-container"),
		    child;

		document.querySelector(".autobet-indicator").style.display = "none";
		while ((child = container.firstChild)) {
			container.removeChild(child);
		}
	}

	// setup auto-bet logic
	(function autobet_loop(){
		if (lastRequest && autoBetting) {
			console.log("Autobetting: "+autoBetting);
			console.log(lastRequest);

			var responseHandler = function(){
		    		if (this.responseText) {
		    			// display error message in auto-betting window
		    			if (this.responseText === "Match has already started.") {
		    				set_autobet(off);
		    				alert("Match has started - autobet failed to bet items");
		    			}
		    		} else {
		    			window.onbeforeunload = function(){};
		    			window.location.href = "http://csgolounge.com/mybets";
		    		}
		    	};

		   	post(lastRequest.url, lastRequest.data, responseHandler);

			setTimeout(autobet_loop, 10000);
		}
	})();
}

/**
 * Function used to overwrite placeBetNew, so we can hook into it
 * Rewritten in vanilla JS from CSGO Lounge's jQuery implementation
 */
function placeBetNew_overwrite(match,tlss) {
	// if no team was selected, error out
	if (!document.getElementById("on").value) {
		document.getElementById("placebut").style.display = "block";
		display_error("You didn't select a team.");
		return;
	}

	// if items have been added to the bet
	if (document.querySelector(".left").children.length > 0) {
		var data = serialize(document.getElementById("betpoll"))+"&match="+match+"&tlss="+tlss,
		    btnClickHandler = function btnClickHandler(e) {
		    		var elm = e.target,
		    		    green = elm.className === "green";

		    		elm.className = green ? "red" : "green";
		    		elm.innerHTML = green ? "Disable auto-bet" : "Enable auto-bet";

		    		set_autobet(!green);
		    	},
		    responseHandler = function(){
		    		console.log(this);
		    		if (this.responseText)
		    			// display error message, with "Enable autobetting" button
		    			display_error(this.responseText, 
		    				          "grey", 
		    				          [{callback: btnClickHandler,
		    				            class: "green",
		    				            content: "Enable auto-bet"}]);
		    		else
		    			window.location.href = "http://csgolounge.com/mybets";
		    	};

		// send appropriate POST
		if (itemsAreReturns) {
			post("http://csgolounge.com/ajax/postBet.php",
				 data,
				 responseHandler);
		} else {
			post("http://csgolounge.com/ajax/postBetOffer.php",
				 data,
				 responseHandler);
		}
	} else {
		document.getElementById("placebut").style.display = "block";
		display_error("You didn't pick any item.");
	}
}

/**
 * Display an error message to the user
 * @param {string} error - error message to display
 * @param {string} color - class name to append to error
 * @param {array} buttons - array of button objects in format:
 *                           { content: string,
 *                           class: string
 *                             callback: function }
 */
function display_error(error, color, buttons) {
	// set focus on current tab if it isn't already
	console.log(chrome);
	console.log(!!buttons);
	chrome.runtime.sendMessage({post: "highlight"},function(){});

	// display error message
	var elm = document.createElement("p");

	elm.innerHTML = error;
	elm.className = "error" + (" "+color || "") + (buttons ? "" : " pointer");
	elm.removeAble = true;

	// create any required buttons
	if (buttons) {
		for (var i = 0; i < buttons.length; i++) {
			var btn = document.createElement("button");

			btn.innerHTML = buttons[i].content;
			btn.className = buttons[i].class;
			btn.callback = buttons[i].callback;
			btn.addEventListener("click", buttons[i].callback);

			elm.appendChild(btn);
		}
	}

	// hook up logic for removing the error message
	if (!buttons)
		elm.addEventListener("click", function(e){
				e.target.parentNode.removeChild(e.target);
			});

	elm.addEventListener("mouseenter", function(e){
			e.target.removeAble = false;
		});
	elm.addEventListener("mouseleave", function leaveHandler(e){
			e.target.removeAble = true;
			if (e.target.removeQueued)
				setTimeout((function(e){return function removeElm(){
						if (e.target.removeAble && e.target.parentNode)
							e.target.parentNode.removeChild(e.target);
						else
							setTimeout(removeElm, 1500);
					}})(e), 1500);
		})
	setTimeout((function(elm){
			return function(){
				if (elm && elm.parentNode)
					if (elm.removeAble)
						elm.parentNode.removeChild(elm);
					else
						elm.removeQueued = true;
			}
		})(elm), 5000);

	document.body.appendChild(elm);
}

/**
 * Serialize a form element - used in place of jQuery's form serialization
 * @param {Element} form - form element to serialize
 * @return {string} - serialized form
 */
function serialize(form) {
	var out = [],
	    l = form.elements.length;

	// loop through every child
	for (var i = 0; i < l; i++) {
		if (!form[i].name)
			continue;

		var name = encodeURIComponent(form[i].name),
		    val = encodeURIComponent(form[i].value.replace(/r?\n/g, "\r\n"));

		out.push((name + "=" + val).replace(/%20/g, "+"));
	}

	return out.join("&");
}

/**
 * Perform a POST request to a url
 * @param {string} url - The URL to request to
 * @param {object} data - the POST data
 * @param {function} callback - The function to call once the request is performed
 * @param {object} headers - a header object in the format {header: value} 
 */
function post(url, data, callback, headers) {
    // create xmlhttprequest instance
    var xhr = new XMLHttpRequest(),
        formatted = [];

    if (typeof data === "object") {
	    for (var k in data) {
	    	formatted.push(encodeURIComponent(k) + "=" + encodeURIComponent(data[k]));
	    }
	    formatted = formatted.join("&");
	} else {
		formatted = data;
	}

    // init
    xhr.addEventListener("load", callback);
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");

    // set headers
    for (var h in headers) {
        if (headers.hasOwnProperty(h))
            xhr.setRequestHeader(h, headers[h]);
    }

    // save lastRequest for later re-sending
    lastRequest = {
    	url: url,
    	data: data,
    	headers: headers
    };

    // send
    xhr.send(formatted);
}