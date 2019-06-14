"strict mode";

// Create the XHR object.
function createServerRequest(method, url) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, true);  // call its open method
  return xhr;
}

// Make the actual server request.

export function makeServerRequest() {
  let searchInput = document.getElementById("word");
  let input = searchInput.value;
  let url = "query?word=" + input;
	//let url = "translate?english=" + input;
  let xhr = createServerRequest('GET', url);

  if (!xhr) {
    alert('Request not found');
    return;
  }

// Load some functions into response handlers.
  xhr.onload = function() {
    let responseStr = xhr.responseText;  // get the JSON string
    let object = JSON.parse(responseStr);  // turn it into an object

    let test = document.getElementById("outputGoesHere");
    test.textContent = object.word;
  }

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  // Actually send request to server
  xhr.send();
}

