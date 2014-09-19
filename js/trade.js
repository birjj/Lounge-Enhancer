// TODO: add logic

/* ToggleReady(true) || document.getElementById("you_notready").click()
 * document.querySelector(".newmodal .newmodal_buttons .btn_green_white_innerfade.btn_medium").click()
 * ConfirmTradeOffer() || document.getElementById("trade_confirmbtn").click()
 */
var toggleRdyBtn = document.getElementById("you_notready"),
    confirmBtn = document.getElementById("trade_confirmbtn");

// make sure this actually is a lounge trade
chrome.storage.local.get("steam_trading", function(data){
		if (data.steam_trading) {
			chrome.storage.local.set({"steam_trading": false}, function(){
					// accept the trade
					toggleRdyBtn.click();

					setTimeout(function x(){
						var acceptSuspiciousBtn = document.querySelector(".newmodal .newmodal_buttons .btn_green_white_innerfade.btn_medium");
						if (!acceptSuspiciousBtn) {
							setTimeout(x, 50);
							return;
						}
						acceptSuspiciousBtn.click();
						confirmBtn.click();
					}, 50);
				});
		}
	});

/*
toggleRdyBtn.click();

// TODO: use MutationObserver instead
setTimeout(function x(){
	var acceptSuspiciousBtn = document.querySelector(".newmodal .newmodal_buttons .btn_green_white_innerfade.btn_medium");
	if (!acceptSuspiciousBtn) {
		setTimeout(x, 50);
		return;
	}
	acceptSuspiciousBtn.click();
	confirmBtn.click();
}, 50);*/