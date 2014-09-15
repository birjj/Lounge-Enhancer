// Notes to self:
/* Steam login workflow:
	Call to https://steamcommunity.com/login/getrsakey/
	- POST {username: [username],
	        donotcache: (new Date()).getTime()}
	- Response {success: [bool],
	            publickey_mod: [str],
	            publickey_exp: [str],
	            timestamp: [str]}
	- onSuccess:
		pubKey = RSA.getPublicKey(publickey_mod, publickey_exp)
		encryptPss = RSA.encrypt(pss, pubKey)
		doLogin (see below)

	Call to https://steamcommunity.com/login/dologin/
	- POST {password: [encryptPss],
	        username: [username],
	        emailauth: [emailauth.value],
	        loginfriendlyname: [loginfriendlyname.value],
	        captchagid: [captchagid.value],
	        captcha_text: [captcha_text.value],
	        emailsteamid: [emailsteamid.value],
	        rsatimestamp: [timestamp from getrsakey],
	        remember_login: [bool],
	        donotcache: (new Date()).getTime()}
	- Response {success: [bool],
	            captcha_gid: [int],
	            captcha_needed: [bool],
	            message: [string],
	            login_complete: [bool] }


*/