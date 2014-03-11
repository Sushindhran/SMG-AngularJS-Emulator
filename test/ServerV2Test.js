/* Sushindhran Harikrishnan
 * 11th March, 2014 
 */
ServerV2Test = TestCase("Server version 2 tests");

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion failed";
	}
}

var dummyUrl = " ";
var gameUrl = "http://3.smg-server.appspot.com/game";
var faqUrl = "http://3.smg-server.appspot.com/faqs";
var uploadfaqUrl = "http://3.smg-server.appspot.com/uploadfaqs";
var uploadChangeUrl = "http://3.smg-server.appspot.com/uploadChangeLog";
var bugReportUrl = "http://3.smg-server.appspot.com/bugReport";
var gameListUrl = "http://3.smg-server.appspot.com/gameList";
var playerStats = "http://3.smg-server.appspot.com/playerStats";
var networkStats = "http://3.smg-server.appspot.com/networkStats";
var usageStats = "http://3.smg-server.appspot.com/usageStats";

//Replace later with actual resp
var faqs = {"Q1" : "Ans1", "Q2" : "Ans2", "Q3" : "Ans3"};  
var change = {1:"Change1", 2: "Change2", 3: "Change3"};
var player = {"email" : "testuser@gmail.com",
		"user" : "testUser",
		"password" : "testPassword",
		"firstName" : "FirstName",
		"lastName" : "LastName"
};

var opponent = {"email" : "testuser1@gmail.com",
		"user" : "testUser1",
		"password" : "testPassword1",
		"firstName" : "FirstName1",
		"lastName" : "LastName1"
};

var viewer = {"email" : "testuser1@gmail.com",
		"user" : "testUser1",
		"password" : "testPassword1",
		"firstName" : "FirstName1",
		"lastName" : "LastName1"
};

//Set the move according to which game you are in
var move = " ";

//Test the View FAQ feature
ServerV2Test.prototype.testViewFAQs = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", faqUrl, true);
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp)===faqs);
			} 
		}
	};
};

//Test the Upload FAQ feature.
ServerV2Test.prototype.testUploadFAQs = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", uploadfaqUrl, true);
	xhr.send(JSON.stringify(faqs));
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(resp==="Uploaded Successfully","Error in uploading FAQs");
			}
		}
	};
};

//Test the Upload ChangeLog feature.
ServerV2Test.prototype.testUploadChangeLog = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", uploadChangeUrl, true);
	xhr.send(JSON.stringify(change));
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(resp==="Uploaded Successfully","Error in uploading change logs");
			}
		}
	};
};

//Test the View Bug Report feature.
ServerV2Test.prototype.testViewBugReport = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", bugReportUrl, true);
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(resp==="Error","Error in loading the bug report");
			}
		}
	};
};

//Test the get player statistics function.
ServerV2Test.prototype.testGetStatistics = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", playerStats, true);
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp).hasOwnProperty("StatCount"),"Error in getting player stats");
			}
		}
	};
};

//Test the get network statistics function.
ServerV2Test.prototype.testGetNetworkStatistics = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", networkStats, true);
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp).hasOwnProperty("StatCount"),"Error in getting network stats");
			}
		}
	};
};

//Test the get player statistics function.
ServerV2Test.prototype.testGetUsageStatistics = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET",usageStats , true);
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp).hasOwnProperty("StatCount"),"Error in getting player stats");
			}
		}
	};
};

//Test the get Opponent information function.
ServerV2Test.prototype.testGetOpponentInfo = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST",opponentDetails, true);
	xhr.send(JSON.stringify(player));
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp)===opponent);
			}
		}
	};
};

//Test the getListofgames function for the viewer.
ServerV2Test.prototype.testGetListOfGames = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST",gameListURL, true);
	xhr.send(JSON.stringify(viewer));
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(JSON.parse(resp).hasOwnProperty(gameCount), "Error in fetching the list of games" );
			}
		}
	};
};

//Test whether the player played his move in time
ServerV2Test.prototype.testMoveInTime = function() {
	var xhr = new XMLHttpRequest();
	setTimeout(
			function(){
				xhr.open("POST",gameURL, true);
								
			},1000);
	xhr.send(JSON.stringify(move));
	xhr.onreadystatechange = function(){
		var status;
		var resp;
		if(xhr.readyState == 4){
			status = xhr.status;
			if (status == 200){
				resp = xhr.response;
				assert(resp=="TimeOut", "Move not made in time" );
			}
		}
	};
};


