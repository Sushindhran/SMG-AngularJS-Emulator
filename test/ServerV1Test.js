/**
 *  Created by Shwetank on 3/11/14.
 **/
ServerV1Test = TestCase("Server version 1 tests")

/*
    Test related globals and utility methods
 */
var ServerConstants = {
    serverUrl : "http://1.smg-server.appspot.com",
    playerPath : "/players",
    matchPath : "/matches",
    gamePath : "/games"
};

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

var TestConstants = {
    email : "testuser@gmail.com",
    user : "testUser",
    password : "testPassword",
    firstName : "FirstName",
    lastName : "LastName"
}

var createPlayer = function() {
    var req = new XMLHttpRequest ()
    var param1 = "email="+TestConstants.email
    var param2 = "password="+TestConstants.password
    var param3 = "firstName="+TestConstants.firstName
    var param4 = "lastName="+TestConstants.lastName
    var params = param1+"&"+param2+"&"+param3+"&"+param4
    params = encodeURIComponent(params)

    req.open("POST", ServerConstants.serverUrl+ServerConstants.playerPath)
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");

    req.send(params)
    return req
}

var deletePlayer = function(playerId) {
    var req = new XMLHttpRequest ()
    req.open("DELETE", ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId)
    req.send()
    return req
}


/*
    This Test tests the player creation at the server
 */

ServerV1Test.prototype.testCreatePlayer = function() {
    var req = createPlayer()
    var response = req.responseText

    assert(!(response === ""), "No response received")
    var json = JSON.parse(response)

    // Check if the login succeeded
    assert(json.hasOwnProperty("playerId"), "Can't create user")

    var playerId = obj["playerId"]


    // Login succeeded now clean up
    deletePlayer(playerId)
}


/*
This test tests if the server sends appropriate error message when creating the same user for the second time
 */
ServerV1Test.prototype.testCreateDuplicatePlayer = function() {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the first player gets created
    assert(json.hasOwnProperty("playerId"), "Can't create first user")


    var req2 = createPlayer()

    // Assert that the server returned an error when trying to create the user for second time
    response = req2.responseText
    json = JSON.parse(response)

    assert(json.hasOwnProperty("error"), "Appropriate error message not received from the server : " + response)

}