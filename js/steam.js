// if we're already logged in through Steam, just log in
if (document.querySelector(".OpenID_loggedInText")) {
	// because Chrome won't let us click the login button before user input...
	console.log("Clicking.");
	document.getElementById("imageLogin").click();
}

/* I don't feel comfortable storing user passwords in storage (not encrypted)
 * so I can't create an auto-login function.  */