/**
 * Created by Shwetank and Sushindhran on 3/11/14.
 */
ServerV3Test = TestCase("Server version 3 tests");

var ServerConstants = {
    serverUrl : "http://3.smg-server.appspot.com",
    playerPath : "/players",
    matchPath : "/matches",
    gamePath : "/games"
};

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
};

var TestConstants = {
    email : "testuser@gmail.com",
    user : "testUser",
    password : "testPassword",
    firstName : "FirstName",
    lastName : "LastName",

    gameName : "mygame1",
    gameId : "1234"

};

var createUserAndLogin = function(parameters) {
    // Set up default parameters
    var param1 = "email="+TestConstants.email;
    var param2 = "password="+TestConstants.password;
    var param3 = "firstName="+TestConstants.firstName;
    var param4 = "lastName="+TestConstants.lastName;
    var params = param1+"&"+param2+"&"+param3+"&"+param4;
    params = encodeURIComponent(params);

    // If user gave his own params use them else default
    parameters = parameters || params;

    var req = new XMLHttpRequest ();
    req.open("POST", ServerConstants.serverUrl+ServerConstants.playerPath);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");

    req.send(parameters);
    var response = req.responseText;
    assert(!response === "", "No response from the server");
    var json = JSON.parse(response);
    var playerId = json["playerId"]

    var req2 = new XMLHttpRequest();
    req2.open("GET", ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId+"?password="+TestConstants.password);
    req2.setRequestHeader("Connection","close");
    req2.send(null);
    return req2;
}


var startMatch = function(playerId, playerId2, gameId, accessSignature){
    var req = new XMLHttpRequest();
    req.open("POST",ServerConstants.serverUrl+ServerConstants.matchPath);
    var params = {"accessSignature" : accessSignature,
                  "playerIds" : [playerId,playerId2],
                  "gameId" : gameId};

    params = encodeURIComponent(params);
    req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length",params.length);
    req.setRequestHeader("Connection","close");

    req.send(params);
    return req;
}


var setNoOfPlayURL = "http://3.smg-server.appspot.com/setPlayers";
var popStatsURL = "http://3.smg-server.appspot.com/popularityChart";
var currentGameStatsURL = "http://3.smg-server.appspot.com/gameStats";
var gameSpecsURL = "http://3.smg-server.appspot.com/gameSpecs";
var chatRoomURL = "http://3.smg-server.appspot.com/chatRoom";

//Test the set number of players function.
ServerV3Test.prototype.testSetNoOfPlayers = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST",setNoOfPlayURL, true);
    var noOfPlayers = 4;
    xhr.send(noOfPlayers);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    assert(resp=="Error", "Could not set the number of players");
};

//Test the getPopularityStats function
ServerV3Test.prototype.testGetPopularityStatistics = function() {
    var xhr = new XMLHttpRequest();
    var currentGameId = 1111;	//Set this later
    xhr.open("POST",popStatsURL, true);
    xhr.send(currentGameId);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    if(resp == "No Such Game"){
           throw "Invalid Game ID";
    }else{
        assert(JSON.parse(resp).hasOwnProperty("Statistics"));
    }
};


//Test the get game stats function
ServerV3Test.prototype.testGetGameStatistics = function() {
    var xhr = new XMLHttpRequest();
    var currentGameId = 1111;	//Set this later
    xhr.open("POST",currentGameStatsURL, true);
    xhr.send(currentGameId);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    if(resp == "No Such Game"){
         throw "Invalid Game ID";
     }else{
        assert(JSON.parse(resp).hasOwnProperty("Statistics"));
     }
};

//Test the function that sets whether the game is turn based or not.
ServerV3Test.prototype.testSetTurnBasedOrNot = function() {
    var xhr = new XMLHttpRequest();
    var currentGameId = 1111;	//Set this later
    var isTurnBased = "Yes";
    var sendData = {"GameID":currentGameId, "IsTurnBased": isTurnBased};
    xhr.open("POST", gameSpecsURL, true);
    xhr.send(sendData);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    if(resp == "No Such Game"){
        throw "Invalid Game ID";
    }else{
        assert(resp=="Successfully set turnbased");
    }
};


//Test the function that sets whether the game has AI or not
ServerV3Test.prototype.testSetAIOrNot = function() {
    var xhr = new XMLHttpRequest();
    var currentGameId = 1111;	//Set this later
    var hasAI = "Yes";
    var sendData = {"GameID":currentGameId, "hasAI": hasAI};
    xhr.open("POST", gameSpecsURL, true);
    xhr.send(sendData);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    if(resp == "No Such Game"){
       throw "Invalid Game ID";
    }else{
        assert(resp=="Successfully set AI");
    }
};

//Test the function that sets whether the room can chat or not
ServerV3Test.prototype.testSetTChatOnOrOff = function() {
    var xhr = new XMLHttpRequest();
    var currentGameId = 1111;	//Set this later
    var roomId = 2222;	//Set later
    var canChat = "Yes";
    var sendData = {"GameID":currentGameId, "RoomID": roomId, "CanChat":canChat};
    xhr.open("POST", chatRoomURL, true);
    xhr.send(sendData);
    var status = xhr.status
    assert(status == 200)
    var resp = xhr.response;
    if(resp == "No Such Game"){
        throw "Invalid Game ID";
      }else if(resp == "No Such Room"){
        throw "Invalid Room ID";
      }else{
        assert(resp=="Successfully set Chat");
    }
};

/*
Tests if a match is created properly
 */
ServerV3Test.prototype.testMatchCreation = function() {
    // Create player 1
    var req = createUserAndLogin();
    response = req.responseText;
    assert(!response === "", "No response from server");
    json = JSON.parse(response);
    var playerId = json["playerId"];
    var accessSignature = json["accessSignature"];

    var req2 = createUserAndLogin();
    var playerId2 = json["playerId"]
    var accessSignature2 = json["accessSignature"]
    var req2 = startMatch(playerId, playerId2, gameId, accessSignature);

    var response = req.responseText
    assert(!response==="","No response from server");
    var json = JSON.parse(response);
    assert(json.hasOwnProperty("matchId"), "Match Id not returned by the server");

    // Cleanup
    deletePlayer(playerId,accessSignature);
    deletePlayer(playerId2,accessSignature2);
}



/*
 Tests if a match creation is rejected when using wrong accessSignature
 */
ServerV3Test.prototype.testMatchCreation = function() {
    // Create player 1
    var req = createUserAndLogin();
    response = req.responseText;
    assert(!response === "", "No response from server");
    json = JSON.parse(response);
    var playerId = json["playerId"];
    var accessSignature = json["accessSignature"];

    var req2 = createUserAndLogin();
    var playerId2 = json["playerId"]
    var accessSignature2 = json["accessSignature"]
    var req2 = startMatch(playerId, playerId2, gameId, "wrong access signature");

    var response = req.responseText
    assert(!response==="","No response from server");
    var json = JSON.parse(response);
    assert(json.hasOwnProperty("matchId"), "Match Id not returned by the server");

    // Cleanup
    deletePlayer(playerId,accessSignature);
    deletePlayer(playerId2,accessSignature2);
}



/*
   Tests if save game works properly
 */
ServerV3Test.prototype.testSaveGameOperation = function () {
    var req = createUserAndLogin();
    response = req.responseText;
    assert(!response === "", "No response from server");
    json = JSON.parse(response);
    var playerId = json["playerId"];
    var accessSignature = json["accessSignature"];

    var req2 = createUserAndLogin();
    var playerId2 = json["playerId"]
    var accessSignature2 = json["accessSignature"];
    var req2 = startMatch(playerId, playerId2, gameId, accessSignature);

    var response = req.responseText
    assert(!response==="","No response from server");
    var json = JSON.parse(response);
    assert(json.hasOwnProperty("matchId"), "Match Id not returned by the server");

    // Save current state using first player's access signature
    req = new XMLHttpRequest();
    var params = {"saveMatch" : true,
                  "accessSignature" : accessSignature};
    req.open(ServerConstants.serverUrl+ServerConstants.matchPath+"/"+json["matchId"]);
    params = encodeURIComponent(params);
    req.send(params);

    // Assert if the response had a success parameter
    response = req.responseText;
    assert(!response==="","No response from Server");
    assert(json.hasOwnProperty("Success"));

    // Cleanup
    deletePlayer(playerId,accessSignature);
    deletePlayer(playerId2,accessSignature2);

}



/*
 Tests if save game operation fails gracefully when wrong accessSignature is used
 */
ServerV3Test.prototype.testSaveGameFailure = function () {
    var req = createUserAndLogin();
    response = req.responseText;
    assert(!response === "", "No response from server");
    json = JSON.parse(response);
    var playerId = json["playerId"];
    var accessSignature = json["accessSignature"];

    var req2 = createUserAndLogin();
    var playerId2 = json["playerId"]
    var accessSignature2 = json["accessSignature"];
    var req2 = startMatch(playerId, playerId2, gameId, accessSignature);

    var response = req.responseText
    assert(!response==="","No response from server");
    var json = JSON.parse(response);
    assert(json.hasOwnProperty("matchId"), "Match Id not returned by the server");

    // Save current state
    req = new XMLHttpRequest();
    var params = {"saveMatch" : true,
        "accessSignature" : "wrong access signature"};
    req.open(ServerConstants.serverUrl+ServerConstants.matchPath+"/"+json["matchId"]);
    params = encodeURIComponent(params);
    req.send(params);

    // Assert if the response had a success parameter
    response = req.responseText;
    assert(!response==="","No response from Server");
    assert(json.hasOwnProperty("Error"));

    // Cleanup
    deletePlayer(playerId,accessSignature);
    deletePlayer(playerId2,accessSignature2);

}

/*
 Tests if save game works properly when the second player (one who did not create the match) saves the game
 */
ServerV3Test.prototype.testSaveGameBySecondPlayer = function () {
    var req = createUserAndLogin();
    response = req.responseText;
    assert(!response === "", "No response from server");
    json = JSON.parse(response);
    var playerId = json["playerId"];
    var accessSignature = json["accessSignature"];

    var req2 = createUserAndLogin();
    var playerId2 = json["playerId"]
    var accessSignature2 = json["accessSignature"];
    var req2 = startMatch(playerId, playerId2, gameId, accessSignature);

    var response = req.responseText
    assert(!response==="","No response from server");
    var json = JSON.parse(response);
    assert(json.hasOwnProperty("matchId"), "Match Id not returned by the server");

    // Save current state using second player's access signature
    req = new XMLHttpRequest();
    var params = {"saveMatch" : true,
        "accessSignature" : accessSignature2};
    req.open(ServerConstants.serverUrl+ServerConstants.matchPath+"/"+json["matchId"]);
    params = encodeURIComponent(params);
    req.send(params);

    // Assert if the response had a success parameter
    response = req.responseText;
    assert(!response==="","No response from Server");
    assert(json.hasOwnProperty("Success"));

    // Cleanup
    deletePlayer(playerId,accessSignature);
    deletePlayer(playerId2,accessSignature2);

}
