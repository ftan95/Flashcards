"strict mode"
const express = require('express')
const port = 58408

//phase 2
const passport = require('passport');
const cookieSession = require('cookie-session');

const GoogleStrategy = require('passport-google-oauth20');
//const sqlite = require('sqlite3');


// Google login credentials, used when the user contacts
// Google, to tell them where he is trying to login to, and show
// that this domain is registered for this service.
// Google will respond with a key we can use to retrieve profile
// information, packed into a redirect response that redirects to
// server162.site:[port]/auth/redirect
const googleLoginData = {
clientID: '358679585614-5adehv9jv038oepkgujvsv02hroga2u4.apps.googleusercontent.com',
clientSecret: 'iSOPVAjscJDLrzTVp0uRlv16',
callbackURL: '/auth/redirect'
};

// Strategy configuration.
// Tell passport we will be using login with Google, and
// give it our data for registering us with Google.
// The gotProfile callback is for the server's HTTPS request
// to Google for the user's profile information.
// It will get used much later in the pipeline.
passport.use( new GoogleStrategy(googleLoginData, gotProfile) );


// Let's build a server pipeline!

// app is the object that implements the express server
const app = express();

// pipeline stage that just echos url, for debugging
app.use('/', printURL);

// Check validity of cookies at the beginning of pipeline
// Will get cookies out of request, decrypt and check if
// session is still going on.
app.use(cookieSession({
											maxAge: 6 * 60 * 60 * 1000, // Six hours in milliseconds
											// meaningless random string used by encryption
											keys: ['hanger waldo mercy dance']
											}));

// Initializes request object for further handling by passport
app.use(passport.initialize());

// If there is a valid cookie, will call deserializeUser()
app.use(passport.session());

// Public static files
app.get('/*',express.static('public'));

// next, handler for url that starts login with Google.
// The app (in public/login.html) redirects to here (not an AJAX request!)
// Kicks off login process by telling Browser to redirect to
// Google. The object { scope: ['profile'] } says to ask Google
// for their user profile information.
app.get('/auth/google',
				passport.authenticate('google',{ scope: ['profile'] }) );
// passport.authenticate sends off the 302 response
// with fancy redirect URL containing request for profile, and
// client ID string to identify this app.

// Google redirects here after user successfully logs in
// This route has three handler functions, one run after the other.
app.get('/auth/redirect',
				// for educational purposes
				function (req, res, next) {
				console.log("at auth/redirect");
				next();
				},
				// This will issue Server's own HTTPS request to Google
				// to access the user's profile information with the
				// temporary key we got in the request.
				passport.authenticate('google'),
				// then it will run the "gotProfile" callback function,
				// set up the cookie, call serialize, whose "done"
				// will come back here to send back the response
	// ...with a cookie in it for the Browser!
	function (req, res) {
	    console.log('Logged in and using cookies!');
			//use this to clear both data base but remember to comment out later!
			//db.all('DELETE FROM Flashcards');
			//db.all('DELETE FROM UserInfo');
				
			//source: http://www.sqlitetutorial.net/sqlite-nodejs/query/
			var googleID = req.user.userData.id;
			searchStr = 'SELECT user FROM Flashcards WHERE user = ?';
	    console.log("search string in gotProfile: ", searchStr);
			
	    db.get(searchStr, [googleID], (err, row) => {
						 console.log("row", row);
		if (err) {
		    return console.error(err.message);
		}
		if (row) {
		    // if row returns true, your user exists
		    console.log("user has flashcards in Flashcards database, send to review page");
		    res.redirect('/user/review.html');
		} else {
		    // if we enter here, user is not found
		    console.log("user does not have any flashcards in Flashcards database, send to create page");
		    res.redirect('/user/translate.html');
		}
	    });
	});

// static files in /user are only available after login
app.get('/user/*',
				isAuthenticated, // only pass on to following function if
				// user is logged in
				// serving files that start with /user from here gets them from ./
				express.static('.')
				);

// next, all queries (like translate or store or get...
//app.get('/query', function (req, res) { res.send('HTTP query!') });


// print the url of incoming HTTP request
function printURL (req, res, next) {
	//console.log("printURL", req.url);
	next();
}

// function to check whether user is logged when trying to access
// personal data
function isAuthenticated(req, res, next) {
	if (req.user) {
	    console.log("Req.session:",req.session);
	    console.log("Req.user:",req.user);
	    next();
	} else {
		res.redirect('/Welcome.html');  // send response telling
		// Browser to go to login page
	}
}

// Some functions Passport calls, that we can use to specialize.
// This is where we get to write our own code, not just boilerplate.
// The callback "done" at the end of each one resumes Passport's
// internal process.

// function called during login, the second time passport.authenticate
// is called (in /auth/redirect/),
// once we actually have the profile data from Google.
function gotProfile(accessToken, refreshToken, profile, done) {
	console.log("Google profile",profile);
	// here is a good place to check if user is in DB,
	// and to store him in DB if not already there.
	// Second arg to "done" will be passed into serializeUser,
	// should be key to get user out of database.
	
	let dbRowID = profile.id;
	let firstName = profile.name.givenName;
	let lastName = profile.name.familyName;
	let userData = {userData: {"id": dbRowID, "first": firstName, "last": lastName } };

	searchStr = 'SELECT googleID FROM UserInfo where googleID = ?';
	console.log("search string in gotProfile: ", searchStr);
	
	db.get(searchStr, [dbRowID], (err, row) => {
				 console.log("got profile row",row);
				 if (err) {
				 return console.error(err.message);
				 }
				 if (row) {
				 // your user exists
				 console.log("gotProfile: user exists");
				 done(null, userData);
				 } else {
				 // insert the user since you can't find it in the db
				 console.log("user does not exist, adding");
				 db.run('INSERT INTO UserInfo (first, last, googleID) VALUES(?, ?, ?)', [firstName, lastName, dbRowID], (err) => {
								if(err) {
								return console.log(err.message);
								}
//								console.log('User was added to the table');
//								db.all(('SELECT * FROM UserInfo'), arrayUserCallback);
								
								done(null, userData);
								})
				 }
				 });
}

// Part of Server's sesssion set-up.
// The second operand of "done" becomes the input to deserializeUser
// on every subsequent HTTP request with this session's cookie.
passport.serializeUser((userData, done) => {
//										console.log("SerializeUser. Input is",userData);
											 done(null, userData);
											 });

// Called by passport.session pipeline stage on every HTTP request with
// a current session cookie.
// Where we should lookup user database info.
// Whatever we pass in the "done" callback becomes req.user
// and can be used by subsequent middleware.
passport.deserializeUser((userData, done) => {
	 //console.log("deserializeUser. Input is:", userData);
									 done(null, userData);
									 });

//phase 2


//API setup
const APIrequest = require('request');
const http = require('http');

const APIkey = "AIzaSyDX-JBLv3lKySRgBgMF0MQkFntTmR6VOwE";  // ADD API KEY HERE
const url = "https://translation.googleapis.com/language/translate/v2?key="+APIkey

//Database setup
const sqlite3 = require("sqlite3").verbose();  // use sqlite
const fs = require("fs"); // file system

const dbFileName = "FlashCards.db"
const db = new sqlite3.Database(dbFileName);


function queryHandler(req, res, next) {
		console.log("inside query handler");
    let qObj = req.query;
    
    if (qObj.word != undefined) {

    // An object containing the data expressing the query to the translate API.
    // Below, gets stringified and put into the body of an HTTP PUT request.
    let requestObject =
        {
        "source": "en",
        "target": "es",
        "q": [
            " "
        ]
				};

    requestObject.q[0] = qObj.word;
    console.log("English phrase: ", requestObject.q[0]);

    // The call that makes a request to the API
    // Uses the Node request module, which packs up and sends off
    // an HTTP message containing the request to the API server
    APIrequest(
        { // HTTP header stuff
            url: url,
            method: "POST",
            headers: {"content-type": "application/json"},
            // will turn the given object into JSON
            json: requestObject	},
          // callback function for API request
          APIcallback
        );
      // callback function, called when data is received from API
      function APIcallback(err, APIresHead, APIresBody) {
        // gets three objects as input
        if ((err) || (APIresHead.statusCode != 200)) {
          // API is not working
          console.log("Got API error");
          console.log(APIresBody);
        } else {
          if (APIresHead.error) {
            // API worked but is not giving you data
            console.log(APIresHead.error);
          } else {
            var text = APIresBody.data.translations[0].translatedText;
            console.log("In Spanish: ", text);
            //output to the browser
            res.json( {"word" : text} );
            
            console.log("\n\nJSON was:");
            console.log(JSON.stringify(APIresBody, undefined, 2));
            // print it out as a string, nicely formatted
          }
        }
      } // end callback function
    }
    else {
      next();
    }
}

/*teach your app to answer translation queries, When it gets a URL in this format
http://server162.site:port/translate?english=example phrase*/
function translateHandler(req, res, next) {
	
    const myurl = require('url');
    const adr = req.url;
		console.log("adr=", adr);
    const q = myurl.parse(adr, true);
    var qdata = q.query;
    
    if (qdata.english!= undefined){
        //Return a HTTP response with an empty body, to let the browser know everything went well.
        res.json( {} );
        var source = qdata.english;
        
        // An object containing the data expressing the query to the translate API.
        // Below, gets stringified and put into the body of an HTTP PUT request.
        let requestObject =
        {
            "source": "en",
            "target": "es",
            "q": [
                  " "
                  ]
				};
        
        requestObject.q[0] = source;
        console.log("English phrase: ", requestObject.q[0]);
        
        // The call that makes a request to the API
        // Uses the Node request module, which packs up and sends off
        // an HTTP message containing the request to the API server
        APIrequest(
                   { // HTTP header stuff
                   url: url,
                   method: "POST",
                   headers: {"content-type": "application/json"},
                   // will turn the given object into JSON
                   json: requestObject    },
                   // callback function for API request
                   APIcallback
                   );
        // callback function, called when data is received from API
        function APIcallback(err, APIresHead, APIresBody) {
            // gets three objects as input
            if ((err) || (APIresHead.statusCode != 200)) {
                // API is not working
                console.log("Got API error");
                console.log(APIresBody);
            } else {
                if (APIresHead.error) {
                    // API worked but is not giving you data
                    console.log(APIresHead.error);
                } else {
                    var text = APIresBody.data.translations[0].translatedText;
                    console.log("In Spanish: ", text);
                    
                    console.log("\n\nJSON was:");
                    console.log(JSON.stringify(APIresBody, undefined, 2));
                    // print it out as a string, nicely formatted
                }
            }
        } // end callback function
    }
    else {
        next();
    }
}

/*Teach server to respond to AJAX queries of the form:
http://server162.site:52547/store?english=hi&spanish=hola*/
function storeHandler(req, res, next){
		console.log("inside save handler");
	
    
    //query URL
    //source: https://www.w3schools.com/nodejs/nodejs_url.asp
    const myurl = require('url');
    const adr = req.url;
		console.log("req.url = ", adr);
    const q = myurl.parse(adr, true);
    var qdata = q.query;
		console.log("q.query = ", q.query);
    
    if (qdata.english != undefined && qdata.spanish != undefined){
        //Return a HTTP response with an empty body, to let the browser know everything went well.
        res.json( {} );
	var user = req.user.userData.id;
        var source = qdata.english;
        var target = qdata.spanish;
        var seen = 0;
        var correct = 0;

				const cmdStr = 'INSERT into Flashcards (user, source, target, seen, correct ) VALUES (?, ?, ?, ?, ?)';
				db.run(cmdStr, user, source, target, seen, correct, insertCallback);
    }
}

function usernameHandler(req, res, next) {
	console.log("inside usernameHandler");
	
	var firstName = req.user.userData.first;

	console.log("users first name is", firstName);
	res.json( {"username" : firstName} );
}

function targetHandler(req, res) {
    var googleID = req.user.userData.id;
    var cmdStr = 'SELECT * FROM Flashcards WHERE user = ?';
    db.all(cmdStr, [googleID], (err, row) => {
	if (err) {
	    throw err;
	}
        var test = row[0].target;
        row[0].seen = row[0].seen + 1;
        res.json( {"target" : test});
    });
}

var count = 0;
var score = 0;
function NextHandler(req, res) {
    count = count + 1;
    var googleID = req.user.userData.id;
    var cmdStr = 'SELECT * FROM Flashcards WHERE user = ?';
    db.all(cmdStr, [googleID], (err, row) => {
	if (err) {
	    throw err;
	}
	if (count < row.length) {
        var test2 = row[count].target;
        row[count].seen = row[count].seen + 1;
	    res.json( {"next" : test2});
	} else {
        var final = "Your score is " + score + "/" + row.length;
	    res.json({"next": final});
	}
    });
}

function AnswerHandler(req, res) {
    const myurl = require('url');
    const adr = req.url;
    const q = myurl.parse(adr, true);
    var qdata = q.query;
    var ans = qdata.test;
    var googleID = req.user.userData.id;
    var cmdStr = 'SELECT * FROM Flashcards WHERE user = ?';
    db.all(cmdStr, [googleID], (err, row) => {
	if (err) {
	    throw err;
	}
	if (ans == row[count].source) {
        row[count].correct = row[count].correct + 1;
        score = score + 1;
        res.json( {"target" : "Correct!"});
	} else {
	    res.json({"target": row[count].source});
	}
    });
}

function insertCallback(err) {
    if ("insertion error: ",err) {
        console.log(err);
    } else {
        console.log("flashcard saved!");
        
	//for debugging
	console.log("insertCallback: user table");
	db.all(('SELECT * FROM UserInfo'), arrayUserCallback);
	
	console.log("insertCallback: flashcard table");
	db.all(('SELECT * FROM Flashcards'), arrayCallback);
    }
}


//arrayData contains an array of objects, each object contains one row
function arrayCallback(err, arrayData){
    if(err) {
        console.log("error: ", err, "\n");
    } else {
	console.log("arraydb: ", arrayData, "\n");
	 //dumpDB();		
        //use below to delete all data from DB when needed
      //  db.all('DELETE FROM Flashcards WHERE user = 1');
    }
}

function arrayUserCallback(err, arrayData){
	if(err) {
		console.log("error: ", err, "\n");
	} else {
		console.log("arrayuser: ", arrayData, "\n");
	    //		dumpUserDB();
		
		//use below to delete all data from DB when needed
		//  db.all('DELETE FROM Flashcards WHERE user = 1');
	}
}

/*
 //to update a row, do NOT omit WHERE, risk changing all columns in all rows
 db.run('UPDATE Flashcards SET seen = 1 WHERE rowid = 1'), errorCallback);
 */

//To test program, print out the whole database
function dumpDB() {
    db.all ( 'SELECT * FROM Flashcards', dataCallback);
    function dataCallback( err, data ) {console.log(data)}
}

function dumpUserDB() {
	db.all ( 'SELECT * FROM UserInfo', dataCallback);
	function dataCallback( err, data ) {console.log(data)}
}

function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find '+url);
    }

// put together the server pipeline
//const app = express();
//app.use(express.static('public'));  // can I find a static file?
app.get('/user/query', queryHandler);
app.get('/user/username', usernameHandler);
app.get('/user/target', targetHandler);
app.get('/user/next', NextHandler);
app.get('/user/answer', AnswerHandler);
app.get('/user/translate', translateHandler);
app.get('/user/store', storeHandler);
app.use( fileNotFound );            // otherwise not found
app.listen(port, function (){console.log('Listening...');} )
