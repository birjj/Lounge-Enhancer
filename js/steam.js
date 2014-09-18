// if we're already logged in through Steam, just log in
if (document.querySelector(".OpenID_loggedInText")) {
	// because Chrome won't let Steam access the .value fields before user input,
	// we can't login even if autofilled
	document.getElementById("imageLogin").click();
}

// if we're logging in from scratch
if (document.getElementById("steamAccountName") && document.getElementById("steamPassword")) {
	// check if we have login data from user
	chrome.storage.local.get("steam_data", function(data) {
			data = JSON.parse(data.steam_data);

			if (data.steam_username && data.steam_password) {
				document.getElementById("steamAccountName").value = data.steam_username;
				document.getElementById("steamPassword").value = data.steam_password;
				document.getElementById("imageLogin").click();
			}
		});
}

/* I don't feel comfortable storing user passwords in storage (not encrypted)
 * so I can't create an auto-login function. */