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

var createPlayer = function(parameters) {
    // Set up default parameters
    var param1 = "email="+TestConstants.email
    var param2 = "password="+TestConstants.password
    var param3 = "firstName="+TestConstants.firstName
    var param4 = "lastName="+TestConstants.lastName
    var params = param1+"&"+param2+"&"+param3+"&"+param4
    params = encodeURIComponent(params)

    // If user gave his own params use them else default
    parameters = parameters || params

    var req = new XMLHttpRequest ()
    req.open("POST", ServerConstants.serverUrl+ServerConstants.playerPath)
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");

    req.send(parameters)
    return req
}

var deletePlayer = function(playerId, accessSignature) {
    var req = new XMLHttpRequest ()
    req.open("DELETE", ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId+"?accessSignature="+accessSignature)
    req.setRequestHeader("Connection", "close");
    req.send()
    return req
}

var login = function(playerId,password) {
    var req = new XMLHttpRequest()
    req.open("GET", ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId+"?password="+password)
    req.setRequestHeader("Connection","close")
    req.send(null)
    return req
}

var getPlayerInfo = function(playerId, accessSignature) {
    var req = new XMLHttpRequest()
    req.open("GET", ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId+"?accessSignature="+accessSignature)
    req.setRequestHeader("Connection", "close")
    req.send(null)
    return req
}

var updatePlayerInfo = function(playerId, accessSignature, firstName, lastName, password) {
    var req = new XMLHttpRequest()

    var params = {
        "accessSignature" : accessSignature,
        "firstName": firstName,
        "lastName": lastName,
        "password": password
    }

    params = encodeURIComponent(params)

    req.open("PUT",ServerConstants.serverUrl+ServerConstants.playerPath+'/'+playerId)
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");

    req.send(params)
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

    var playerId = json["playerId"]
    var accessSignature = json["accessSignature"]


    // Login succeeded now clean up
    deletePlayer(playerId, accessSignature)
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
    var accessSignature = json["accessSignature"]

    var req2 = createPlayer()

    // Assert that the server returned an error when trying to create the user for second time
    response = req2.responseText
    json = JSON.parse(response)

    assert(json.hasOwnProperty("error"), "Appropriate error message not received from the server : " + response)

    // Cleanup
    deletePlayer(json["playerId"],accessSignature)

}


/*
* Test Successful Player login
 */
ServerV1Test.prototype.testPlayerLogin = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    var response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    var accessSignature = json["accessSignature"]

    // Cleanup
    deletePlayer(playerId, accessSignature)
}


/*
Test unsuccessful login on using the wrong password
 */
ServerV1Test.prototype.testUnsuccessfulLogin = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, "wrongPassword")


    assert(req.status == 403, "Response code is not 403 " + req.status)
    var response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")
    var accessSignature = json["accessSignature"]
    // Cleanup
    deletePlayer(playerId,accessSignature)

}

/*
Test accessSignature login and get playerinfo
 */
ServerV1Test.prototype.testGetPlayerInfo = function() {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    var response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test getting player info through accessSignature

    var accessSignature = json["accessSignature"]
    req = getPlayerInfo(playerId,accessSignature)

    // Clean up
    deletePlayer(playerId,accessSignature)

}

/*
Test wrong playerId getPlayerInfo
 */
ServerV1Test.prototype.testWrongPlayerIdAccess = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test getting player info for wrong player id through accessSignature

    var accessSignature = json["accessSignature"]
    req = getPlayerInfo("wrongPlayerId",accessSignature)
    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    // assert that error is returned
    assert(json.hasOwnProperty("error"))

    // Cleanup
    deletePlayer(playerId,accessSignature)
}

/*
Test wrong accessSignature getPlayerInfo
 */
ServerV1Test.prototype.testWrongAccessSignature = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test getting player info for wrong player id through accessSignature

    var accessSignature = json["accessSignature"]
    req = getPlayerInfo(playerId,"wrong signature")
    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    // assert that error is returned
    assert(req.status == 403, "Http response is not 403")
    assert(json.hasOwnProperty("error"))

    // Cleanup
    deletePlayer(playerId,accessSignature)
}

/*
*Update a player info
*/
ServerV1Test.prototype.testUpdatePlayerInfo = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test updating player info

    var accessSignature = json["accessSignature"];
    req = updatePlayerInfo(playerId,accessSignature,"New First", "New Last", "newpassword");
    response = req.responseText;
    assert(!response === "", "No response received");
    json = JSON.parse(response);
    // assert that operation was successful
    assert(json.hasOwnProperty("success"));

    // Cleanup
    deletePlayer(playerId,accessSignature)
}


/*
    Tries to update a player Info for invalid playerid
 */
ServerV1Test.prototype.testUpdatePlayerInfoWrongPlayerId = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test updating player info

    var accessSignature = json["accessSignature"];
    req = updatePlayerInfo("wrongPlayerID",accessSignature,"New First", "New Last", "newpassword");
    response = req.responseText;
    assert(!response === "", "No response received");
    json = JSON.parse(response);
    // assert that operation returned error
    assert(json.hasOwnProperty("error"));

    // Cleanup
    deletePlayer(playerId,accessSignature)
}

/*
  Tries to update playerinfo with wrong access Signature
 */
ServerV1Test.prototype.testUpdatePlayerWrongSignature = function () {
    var req = createPlayer()
    var response = req.responseText

    assert(!response === "", "No response received")
    var json = JSON.parse(response)

    // Assert that the player gets created
    assert(json.hasOwnProperty("playerId"), "Unable to create user")

    var playerId = json["playerId"]
    req = login(playerId, TestConstants.password)

    response = req.responseText
    assert(!response === "", "No response received")
    json = JSON.parse(response)
    assert(json.hasOwnProperty("accessSignature"), "Access Signature not found in the response")
    assert(json.hasOwnProperty("email"), "Email not found in the response")

    // Test updating player info

    var accessSignature = json["accessSignature"];
    req = updatePlayerInfo(playerId,"wrong access Signature","New First", "New Last", "newpassword");
    response = req.responseText;
    assert(!response === "", "No response received");
    json = JSON.parse(response);
    // assert that operation was successful
    assert(req.status = 403, "Http response was not 403");
    assert(json.hasOwnProperty("success"));

    // Cleanup
    deletePlayer(playerId,accessSignature);
}