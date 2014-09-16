// if we're already logged in through Steam, just log in
if (document.querySelector(".OpenID_loggedInText")) {
	// because Chrome won't let Steam access the .value fields before user input,
	// we can't login even if autofilled
	document.getElementById("imageLogin").click();
}

/* I don't feel comfortable storing user passwords in storage (not encrypted)
 * so I can't create an auto-login function. */