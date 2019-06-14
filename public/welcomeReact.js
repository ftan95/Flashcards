'use strict'

function Overall() {
    return React.createElement(
	"div",
	{id: "overall"}, Welcome(), Login()
    )
}

function Welcome() {
    return React.createElement(
        "div",
        {id: "welcome"}, Text()
    )
}

function Text() {
    return React.createElement(
        "div",
        {id: "text"}, React.createElement("p", {id: "lango"}, "Welcome to Lango!"),
        React.createElement("p", {id: "custom"}, "Customize your vocabulary")
    )
}

function Login() {
    return React.createElement(
        "div",
        {id: "login"},
				React.createElement("button", {type: "login", value: "Log in with Google", id: "loginButton", onClick: goToGoogle},
        React.createElement("img", {src: "./assets/google.jpg", id: "image"}), "Log in with Google")
    )
}

function goToGoogle() {
	window.location.href="auth/google";
}

var main = React.createElement(
	"main",
	null,
	React.createElement(Overall,null)
);

ReactDOM.render(
    main, document.getElementById('root')
);
