/**
 * Todo:
 *   - Allow hiding of trades (seperates upcoming and finished games)
 *   - Allow auto-retry for when bots are down
 *   - Allow auto-accept offers
 *   - Create popup for browser action (next X games, my winnings)
 */
// CONSTANTS
var GREEN = "#76EE00",
    ORANGE = "#FFA500",
    RED = "#FF0000",
    IMG_PATHS_19 = ["imgs/action/bad_19.png", "imgs/action/unstable_19.png", "imgs/action/good_19.png", "imgs/action/empty_19.png"],
    IMG_PATHS_38 = ["imgs/action/bad_38.png", "imgs/action/unstable_38.png", "imgs/action/good_38.png", "imgs/action/empty_38.png"];

// VARIABLES
var lastError;

// INIT
// why is onInstalled fired on reload, yet onStartup isn't?
// more importantly - why isn't there an onLoad event?
chrome.runtime.onInstalled.addListener(function(){
    console.log("Starting extension");
    chrome.alarms.clearAll();
    // create alarm to call icon updater every minute
    get_status(status_loop);
    chrome.alarms.create("loopAlarm", {periodInMinutes: 1});
    chrome.alarms.onAlarm.addListener(function(a){
            var d = new Date();
            console.log("Checking status ("+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+")");
            get_status(status_loop);
        });

    // TODO: code function to get winnings
});

/**
 * Listens for message
 */
chrome.runtime.onMessage.addListener(function(request,sender,callback) {
    // if we're getting upcoming matches
    if (request.get === "games") {
        get_games(request.num, (function(callback){
                return function(arr){
                    callback(arr);
                }
            })(callback));
    }

    // if we're getting status
    if (request.get === "status") {
        chrome.storage.local.get("status", callback);
    }

    // if we're asked to highlight a tab
    if (request.post === "highlight") {
        chrome.tabs.highlight({tabs: [sender.tab.index]}, callback);
    }

    return true;
});

/**
 * Get the next X games
 * Can return less than X games, if no more exist
 * @param {int} num - number of games to return
 * @param {function} callback - callback function
 * Calls callback with one parameter:
 * {array} - array of match objects, each formatted as follows:
 *           {time: string,
 *            link: string
 *            team1: {
 *               name: string,
 *               percent: int,
 *               imgUrl: string
 *            },
 *            team2: {
 *               name: string,
 *               percent: int,
 *               imgUrl: string
 *            }}
 */
function get_games(num, callback) {
    // since we need logic in the callback, we gotta do it like this
    var func = (function(num,callback){return function(){
            // this function is called by XMLHttpRequest
            // all logic is in here

            // if site failed to load, error
            if (this.status !== 200) {
                callback({error: this.statusText, errno: this.status});
                return;
            } else {
                // note: to save a bit on DOM parsing, I extract a substring first
                // this might break in the future; possible TODO: create more reliable method

                // extract the relevant part of the markup
                var str = this.responseText,
                    startInd = str.indexOf("<article class=\"standard\" id=\"bets"),
                    endInd = str.indexOf("<div id=\"modalPreview", startInd),
                    containerStr = this.responseText.substring(startInd,endInd);

                // parse
                var parser = new DOMParser(),
                    doc = parser.parseFromString(containerStr, "text/html"),
                    matches = doc.querySelectorAll(".matchmain");
                // TODO: add error handling

                var output = [];

                // loop through all matches
                for (var i = 0, j = matches.length; i < j && output.length < num; i++) {
                    var match = matches[i],
                        finished = match.querySelector(".match").className.indexOf("notaviable") !== -1,
                        timeStr = match.querySelector(".matchheader div:first-child").innerHTML.replace('"', '\"').trim();

                    // if match is over or live, skip it
                    if (finished || timeStr.indexOf("LIVE") !== -1)
                        continue;

                    // extract data
                    var matchLink = "http://csgolounge.com/"+match.querySelector(".matchleft > a").getAttribute("href"),
                        team1Container = match.querySelector(".match a > div:first-child"),
                        team1 = {name: team1Container.querySelector("b:first-child").textContent,
                                 percent: parseInt(team1Container.querySelector("i").textContent),
                                 imgUrl: /url\('(.*?)'\)/.exec(team1Container.querySelector(".team").getAttribute("style"))[1]},
                        team2Container = match.querySelector(".match a > div:nth-child(3)"),
                        team2 = {name: team2Container.querySelector("b:first-child").textContent,
                                 percent: parseInt(team2Container.querySelector("i").textContent),
                                 imgUrl: /url\('(.*?)'\)/.exec(team2Container.querySelector(".team").getAttribute("style"))[1]};

                    // format object, and push to output
                    output.push({time: timeStr,
                                 link: matchLink,
                                 team1: team1,
                                 team2: team2});
                }
                
                // end
                callback(output);
            }
        }})(num, callback);

    get("http://csgolounge.com/", func);
}

/**
 * Repeatedly checks the status of the lounge bots
 * Only to be used as callback for get_status
 */
function status_loop(vals) {
    if (!vals)
        console.error("status_loop should only be used as callback for get_status");

    var iconNum = vals.error ? 3 : // if error, change to grey
                  (vals.status.indexOf(ORANGE) === -1 && vals.status.indexOf(RED) === -1) ? 2 : // if good, change to green
                  (!vals.offline) ? 1 : // if bots are online, but service(s) are down
                  0; // if down, change to red

    if (vals.error)
        console.error("Failed to get status: [#"+vals.errno+"] "+vals.error);

    set_icon(iconNum);
}

/**
 * Get the current bot status on CSGOLounge
 * @param {function} callback - callback function
 * Calls callback with one parameter:
 *   {array} - array of color values for top-most row in status table (see csgolounge.com/status)
 */
function get_status(callback) {
    // since we need logic in the callback, we gotta do it like this
    var func = (function(callback, timeout){return function(){
            // this function is called by XMLHttpRequest
            // all logic is in here
            // clear timeout, so icon isn't changed to grey
            clearTimeout(timeout);

            // if site failed to load, error
            if (this.status !== 200) {
                callback({error: this.statusText, errno: this.status});
                return;
            } else {
                // extract colors
                var response = this.responseText.replace(/\s/g,""), // remove whitespace
                    offline = (response.indexOf("BOTSAREOFFLINE") !== -1),
                    tableReg = /<tablealign="center"cellpadding="7"[0-9a-z=%"]+>.*?<\/table>/,
                    table = tableReg.exec(response)[0],
                    colorReg = /#[0-8A-F]+/g,
                    colors = table.match(colorReg); // extract color codes from table

                // save to status, so we don't need to retrieve again on popup
                chrome.storage.local.set({status: colors}, function(){});

                // call actual callback
                callback({offline: offline,
                          status: colors});
            }
        }})(callback, setTimeout(function(){set_icon(3)}, 5000));

    // request status page, running the above function
    get("http://csgolounge.com/status", func);
}

/* =============================================================== *
 * Helper functions
 * =============================================================== */

/**
 * Sets the browserAction icon
 * @param {int} type - icon to change to: red (0), orange (1), green (2) or grey (3)
 */
function set_icon(type) {
    chrome.browserAction.setIcon({path: {19: IMG_PATHS_19[type],
                                         38: IMG_PATHS_38[type]}});
}

/**
 * Perform a GET request to a url
 * @param {string} url - The URL to request to
 * @param {function} callback - The function to call once the request is performed
 * @param {object} headers - a header object in the format {header: value} 
 */
function get(url, callback, headers) {
    // create xmlhttprequest instance
    var xhr = new XMLHttpRequest();

    // init
    xhr.addEventListener("load", callback);
    xhr.open("GET", url, true);

    // set headers
    for (var h in headers) {
        if (headers.hasOwnProperty(h))
            xhr.setRequestHeader(h, headers[h]);
    }

    // send
    xhr.send();
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