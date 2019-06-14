//const sqlite3 = require("sqlite3").verbose();  // use sqlite
//const fs = require("fs"); // file system

// Create the XHR object.
function createDBRequest(method, url) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);  // call its open method
    return xhr;
}

// Make the actual server request.

export function makeDbRequest() {
		console.log("inside makeDBRequest");
    //need to retrieve source and target to create url
    let source = document.getElementById("word");
    let searchOutput = document.getElementById("outputGoesHere");
    let url = "store?english=" + source.value + "&spanish=" + searchOutput.textContent;
    let xhr = createDBRequest('GET', url);
	console.log("english content in make DbReq",source.textContent);
	console.log("spanish content in make DbReq",searchOutput.textContent);
	
    if (!xhr) {
        alert('Request not found');
        return;
    }
    
    xhr.onerror = function() {
        alert('Woops, there was an error making the request.');
    };
    
    // Actually send request to server
    xhr.send();
}
