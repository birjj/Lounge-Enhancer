// INIT
console.log("Loading ")
var path = window.location.pathname,
    pathToPage = {"/": "home",
                  "/status": "status",
                  "/myprofile": "profile",
                  "/mybets": "bets",
                  "/match": "match"},
    pageType = pathToPage[path] || "unknown",
    itemsAreReturns = false,
    currentTab;

// INIT
if (pageType === "match")
	init_match_page();

/**
 * Sets up hooks for the match page
 */
function init_match_page() {
	// ported to regular JS from lounge's jQuery implementation
	var placeBetNew_hook = function(match,tlss) {
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

				    		// TODO: Add auto-bet logic
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
		},
		match = /=([0-9]+)/.exec(window.location.search)[1],
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
	newBtn.addEventListener("click", (function(match,tlss){return function(){placeBetNew_hook(match,tlss)}})(match,tlss));

	// replace
	oldBtn.parentNode.appendChild(newBtn);
	oldBtn.parentNode.removeChild(oldBtn);
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
	elm.className = "error " + (color || "") + (buttons ? "" : " pointer");
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

    // send
    xhr.send(formatted);
}