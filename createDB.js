// Globals
const sqlite3 = require("sqlite3").verbose();  // use sqlite
const fs = require("fs"); // file system

const dbFileName = "FlashCards.db"
// makes the object that represents the database in our code
const db = new sqlite3.Database(dbFileName);

// Initialize table.
// If the table already exists, causes an error.
// Fix the error by removing or renaming Flashcards
const cmdStr = 'CREATE TABLE Flashcards (user TEXT, source TEXT, target TEXT, seen INT, correct INT )';
db.run(cmdStr,tableCreationCallback);

// Phase 2 - create table 2 for user information
//const cmdStr2 = 'CREATE TABLE UserInfo (first TEXT, last TEXT, googleID TEXT )';
//db.run(cmdStr2,tableCreationCallback);

// Always use the callback for database operations and print out any
// error messages you get.
function tableCreationCallback(err) {
	if (err) {
		console.log("Table creation error",err);
	} else {
		console.log("Database created");
		db.close();
	}
}
