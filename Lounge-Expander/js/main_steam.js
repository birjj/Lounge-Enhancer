// Plans:

/**
 * Auto-retry betting
 */



/**
 * - Constructor
 * For overriding alerts. Adds message to bottom right instead
 */ 
function Popup(msg){
	if (!(this.container = document.querySelector(".enhancer#popup-container"))) {
		// create container if doesn't exist
		this.container = createElm({ type: "section",
		                             id: "popup-container"});
	}

	this.message = msg;
	this.elm = createElm({ type: "div",
                           class: "popup",
                           content: "<p>"+msg+"</p>",
                           parent: this.container });

	this.elm.addEventListener("click",(function(){
		                                   this.elm.remove();
		                               }).bind(this));
}

// -- Helper-functions

/**
 * Create element
 * mixed data - string (element type) or object (containing type, content, id, class and/or parent)
 */
function createElm(data) {
	if (typeof data === "string")
		data = { type: data,
				 parent: document.body };

	if (!data.type)
		throw new TypeError("createElm requires a type.");
	if (!data.parent)
		data.parent = document.body;

	data.class = "enhancer "+data.class;

	var elm = document.createElement(data.type);
	if (data.class)
		elm.className = data.class;
	if (data.content)
		elm.innerHTML = data.content;

	for (var k in data) { // apply any custom attributes (and id)
		if (data.hasOwnProperty(k) && !/^(class|content|parent|type)$/.test(k)) {
			elm.setAttribute(k, data[k]);
		}
	}
	data.parent.appendChild(elm);

	return elm;
}