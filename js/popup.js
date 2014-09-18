// CONSTANTS
var STATUS_NAMES = ["The trade server", "The backpack API", "The trading API", "The Steam client", "The community Server", "Bets rechecking", "Returns rechecking"];

// INIT
// hook save settings button
document.addEventListener("DOMContentLoaded", function(){
	document.querySelector(".settings button").addEventListener("click",save);
	});
// gets up to the next 4 games
chrome.runtime.sendMessage({get: "games", num: 3}, 
	function(matches){
		// create the title of the section
		if (matches) {
			var title = document.createElement("header");
			title.textContent = "Bets";
			document.querySelector(".main").appendChild(title);
		}
		// create all match elements
		for (var i = 0; i < matches.length; i++) {
			var elm = create_match_elm(matches[i]);
			document.querySelector(".main").appendChild(elm);
		}
		hookLinks();
	});
// gets an array of statuses
chrome.runtime.sendMessage({get: "status"},
	function(colors) {
		var colors = colors.status,
		    i;

		console.log(Array(colors)[0]);
		// create status' for every unstable service
		while ((i = colors.lastIndexOf("#FFA500")) !== -1) {
			var status = document.createElement("p");

			status.textContent = STATUS_NAMES[i] + " is unstable.";
			status.className = "status orange";

			document.body.insertBefore(status, document.body.firstChild);

			colors[i] = "";
		}

		// create status' for every dead service
		while ((i = colors.lastIndexOf("#FF0000")) !== -1) {
			var status = document.createElement("p");

			status.textContent = STATUS_NAMES[i] + " is down.";
			status.className = "status red";

			document.body.insertBefore(status, document.body.firstChild);

			colors[i] = "";
		}
	});

/**
 * Save settings
 */
function save() {
	console.log("Saving...");
	var usr = document.getElementById("steamName").value,
	    pss = document.getElementById("steamPass").value,
	    obj = {steam_username: usr,
	           steam_password: pss};

	console.log(obj);

	chrome.storage.local.set({"steam_data": JSON.stringify(obj)}, function(){
			document.querySelector(".settings-check").checked = false;
		});
}

/**
 * Make all links open in a new tab when clicked
 */
function hookLinks() {
	var links = document.getElementsByTagName("a");
	console.log(links);
	for (var i = 0; i < links.length; i++) {
		var l = links[i],
		    href = l.href;

		console.log(href);
		l.onclick = (function(href) { return function(){
				chrome.tabs.create({active: true,
			                    	url: href}) }})(href);
	}
}

/**
 * Creates a match element from a data object
 * @param {object} data - data object, often from bg.get_games()
 * @return {Element} - match element
 */
function create_match_elm(data) {
	var main = document.createElement("div"),
	    header = document.createElement("p"),
	    a = document.createElement("a"),
	    box = document.createElement("div"),
	    team1 = create_team_elm(data.team1, 0),
	    vs = document.createElement("p");
	    team2 = create_team_elm(data.team2, 1);

	// set data for each individual element
	main.className = "match";
	header.className = "header";
	header.innerHTML = data.time;
	a.href = data.link;
	box.className = "box";
	vs.className = "vs inline-block";
	vs.textContent = "vs";

	// string elements together
	box.appendChild(team1);
	box.appendChild(vs);
	box.appendChild(team2);
	a.appendChild(box);
	main.appendChild(header);
	main.appendChild(a);

	return main;
}

/**
 * Creates a team element from a data object
 * @param {object} data - data object, often from bg.get_games().team[1/2]
 * @param {int} num - indicates position of team - either 0 (left) or 1 (right)
 * @return {Element} - team element
 */
function create_team_elm(data, num) {
	var main = document.createElement("div"),
	    text = document.createElement("div"),
	    name = document.createElement("b"),
	    percent = document.createElement("i");

	// set data for each individual element
	main.className = "team "+(num?"right":"left");
	main.setAttribute("style", "background-image:url("+(data.imgUrl || "../imgs/default_team.png")+")");
	text.className = "teamtext";
	name.className = "name";
	name.innerHTML = data.name;
	percent.className = "percentage";
	percent.textContent = data.percent+"%";

	// string elements together
	text.appendChild(name);
	text.appendChild(percent);
	main.appendChild(text);

	return main;
}