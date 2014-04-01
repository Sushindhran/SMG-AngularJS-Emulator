/**
 * Created by Sushindhran on 22/03/14.
 */
var app = angular.module('ajsEmulator', []);

//Service that holds all properties shared across the controllers
app.service('sharedProperties', function ($rootScope) {
    var gameUrl = "";
    var state = {playersIframe : []};
    state.gameState = {};
    state.visibleTo = {};
    state.playerIdToNoOfTokensInPot = {};
    var playersInfo = [];
    var numberOfPlayers;

    //Function to display messages on the console
    var console = function(message){
        document.getElementById("console").value += message + "\n";
    };

    //Function to broadcast changes to all controllers
    var broadcast = function (identifier, value) {
        console("Broadcasting "+identifier);
        $rootScope.$broadcast(identifier, value);
    };

    return{
        state : state,
        getGameUrl: function () {
            return gameUrl;
        },
        setGameUrl: function(value) {
            gameUrl = value;
            //Call the function to broadcast the game Url
            broadcast('gameUrl.update',gameUrl);
        },
        getState: function(){
            return state;
        },
        setState: function(st){
            state = st;
        },
        getGameState: function(){
            return state.gameState;
        },
        setGameState: function(gState){
            state.gameState = gState;
        },
        getVisibleTo: function(){
            return state.visibleTo;
        },
        setVisibleTo: function(visible){
            state.visibleTo = visible;
        },
        setPlayerIdToNoOfTokensInPot : function(playerIdTokenMap){
            state.playerIdToNoOfTokensInPot = playerIdTokenMap;
        },
        getPlayerIdToNoOfTokensInPot : function(){
            return state.playerIdToNoOfTokensInPot;
        },
        getNumberOfPlayers: function(){
            return numberOfPlayers;
        },
        setNumberOfPlayers: function(noPlayers){
            numberOfPlayers = noPlayers;
        },
        getPlayersInfo: function(){
            return playersInfo;
        },
        setPlayersInfo : function(players){
            playersInfo = players;
        },

        broadcast: broadcast
    };
});

//Holds all the controllers used
var controllers = {};

//Url controller
controllers.urlCtrl = function($scope, sharedProperties){
    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n";
    };

    $scope.createPlayersInfo = function (noOfPlayers) {
        var list = [];
        var i = 0, playerId = 42;
        for(i=0; i< noOfPlayers; i++) {
            playerId += i;
            list = list.concat({"playerId":playerId});
        }
        sharedProperties.setPlayersInfo(list);
    };


    $scope.setUrl = function (url, noOfPlayers) {
        sharedProperties.setNumberOfPlayers(noOfPlayers);
        $scope.createPlayersInfo(noOfPlayers);
        sharedProperties.setGameUrl(url);
    };
};

//Controller that listens for changes in the game state
controllers.listenerCtrl = function ($scope, sharedProperties) {
    var source = null;
    $scope.gameUrl = "";
    $scope.msg = {};
    $scope.gameState = {};
    $scope.visibleTo = {};

    //Get all the shared properties to be used
    var state = {playersIframe : []};
    var updateUIPlayerId = 0;
    var noPlayers;
    var playersInfo;
    var lastMovePlayer=0;
    var lastGameState={};
    var lastMove=[];
    var playerIdToNoOfTokensInPot={};
    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n";
    };

    //to be modified
    $scope.send = function(source, message){
        //$scope.console("Sending to Game: \n"+ JSON.stringify(message));
        source.postMessage(message,"*");
    };

    $scope.test = function() {
        $scope.send(window,{"noOfPlayers":2})
    };

    $scope.sendUpdateUi =  function(source, yourPlayerId){
        var state = sharedProperties.getState();
        updateUIPlayerId = yourPlayerId;
        $scope.send(source, {'playersInfo': playersInfo, 'type': 'UpdateUI', 'state':getStateforPlayerId(yourPlayerId), 'lastState':lastGameState,
            'lastMove':lastMove, 'lastMovePlayerId': lastMovePlayer, 'playerIdToNumberOfTokensInPot':playerIdToNoOfTokensInPot,
            'yourPlayerId': yourPlayerId});
    };

    $scope.sendVerifyMove = function(source,currentPlayer) {
        //var state = sharedProperties.getState();
        for(var k=0;k<playersInfo.length;k++){
            var playerId = playersInfo[k].playerId;
            if(playerId!=currentPlayer) {
                var x = 0;
                if(currentPlayer>42){
                    x=currentPlayer-42;
                }

                if(playerId-42!==x) {
                    $scope.console(playerId-42+" Send Verify Move");
                    $scope.send(state.playersIframe[playerId-42], {"playersInfo": playersInfo, "type": "VerifyMove", "state": getStateforPlayerId(playerId), "lastState": lastGameState,
                        "lastMove": lastMove, "lastMovePlayerId": lastMovePlayer, "playerIdToNumberOfTokensInPot": playerIdToNoOfTokensInPot});
                }
            }
        }
    };

    //Function that shuffles the keys and returns the shuffled set
    $scope.shuffle =  function(keys){
        var keysCopy = keys.slice();
        var result = [];
        while(!(keysCopy.length<1)){
            var index = Math.floor(Math.random()*keysCopy.length);
            var removed = keysCopy.splice(index,1);
            result.push(removed);
        }
        return result;
    };

    //Function to copy an object
    var clone = function(obj) {
        if (null == obj || "object" != typeof obj)
            return obj;

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
    };

    //Function to get the state for a particular playerId
    var getStateforPlayerId = function(playerId){
        var result = {};
        var keys = getKeys($scope.gameState);
        //$scope.console(JSON.stringify($scope.gameState));
        //$scope.console("Keys "+keys+" "+keys.length);
        for(var k=0;k<keys.length;k++){
            var visibleToPlayers = $scope.visibleTo[keys[k]];
            var value = null;
            //$scope.console(visibleToPlayers);
            if(visibleToPlayers=="ALL"){
                value = $scope.gameState[keys[k]];
            }
            //$scope.console(visibleToPlayers.indexOf(playerId));
            if(visibleToPlayers.indexOf(playerId)>-1){
                //$scope.console("Here");
                value = $scope.gameState[keys[k]];
            }
            result[keys[k]] = value;
        }
        return result;
    };

    //Making the frames
    $scope.makeFrames = function (noOfPlayers,url) {
        //$scope.console("Making Iframes");
        for(var i = 0; i < noOfPlayers; i++) {
            //$scope.console(i+" is i");
            parent = document.getElementById("frames")
            ifrm = document.createElement("IFRAME");
            ifrm.setAttribute("src", url);
            ifrm.setAttribute("id","frame"+i);
            ifrm.style.width = 1000 + "px";
            ifrm.style.height = 600 + "px";
            parent.insertBefore(ifrm);
            //state.playersIframe[i] = ifrm;
        }
    };

    //Function to get the keys from a JSON object
    var getKeys = function(object){
        //var parsedObject = JSON.stringify(object);
        //$scope.console(parsedObject);
        var keys = [];

        for(var key in object){
            //if(object.hasOwnProperty("key"))
            keys.push(key);
        }
        return keys;
    };

    // Function that finds out which player sent the message
    var findMessageSource = function(source) {
        for(var i = 0 ; i < sharedProperties.getNumberOfPlayers(); i++) {
            //$scope.console(source+" source ");
            if (source === state.playersIframe[i]){
                return i;
            }
        }
    };
    var playerCount = 0;
    //Function that handles the callback and mutates the state.
    var handleCallback = function (msg) {

        $scope.$apply(function () {

            //Get the data from the JSON
            $scope.msg = JSON.parse(msg.data);

            //Display the message on the console
            $scope.console("Receiving from Game: "+ ($scope.msg.type));
            $scope.console("json : "+ JSON.stringify($scope.msg));

            if($scope.msg.type == "GameReady"){
                state.playersIframe.push(msg.source);
                playerCount++;
                // Send update ui as soon as you receive a game ready.
                $scope.gameState = {};
                $scope.sendUpdateUi(msg.source, playersInfo[playerCount - 1].playerId);
            }else if($scope.msg.type == "MakeMove"){
                var playerId = playersInfo[findMessageSource(msg.source)].playerId;
                lastMovePlayer = playerId;
                var operations =  $scope.msg.operations;
                //$scope.console(JSON.stringify(operations));
                lastMove = (operations);
                lastGameState = clone($scope.gameState);
                //$scope.console(JSON.stringify(lastGameState));
                for (var i = 0; i < operations.length; i++) {
                    var operation = operations[i];
                    //Check for all types of Operations
                    if(operation.type == "SetTurn"){
                        // $scope.console("SetTurn");
                    }else if (operation.type == "Set") {
                        $scope.gameState[operation.key] = operation.value;
                        $scope.visibleTo[operation.key] = operation.visibleToPlayerIds;
                    }else if(operation.type == "SetRandomInteger"){
                        var key = operation.key;
                        var from = operation.from;
                        var to  = operation.to;
                        //Random number is the value
                        var value = Math.floor((Math.random()*(to-from))+from);
                        $scope.gameState[operation.key] =  value;
                        $scope.visibleTo = "ALL";
                    }else if(operation.type == "SetVisibility"){
                        $scope.visibleTo[operation.key] = operation.visibleToPlayerIds;
                    }else if(operation.type == "Delete"){
                        var key = operation.key;
                        //Remove from the gameState array
                        delete $scope.gameState[key];
                        //Remove from visibleTo array
                        delete $scope.visibleTo[key];
                    }else if(operation.type == "Shuffle"){
                        var keys = operation.keys;
                        var shuffledKeys = $scope.shuffle(keys);
                        var oldGameState = $scope.gameState;
                        var oldVisibleTo = $scope.visibleTo;
                        for(var j=0;j<shuffledKeys.length;j++){
                            var fromKey = keys[j];
                            var toKey = shuffledKeys[j];
                            $scope.gameState[toKey] = oldGameState[fromKey];
                            $scope.visibleTo[toKey] = oldVisibleTo[fromKey];
                        }
                    }else if(operation.type == "AttemptChangeTokens"){
                        var p = operation.playerIdToNumberOfTokensInPot;
                        for( var i = 0; i < sharedProperties.getNumberOfPlayers(); i++){
                            var id;
                            id = playersInfo[i].playerId.toString();
                            console.log("id is "+id);
                            if(! playerIdToNoOfTokensInPot.hasOwnProperty(id) ) {
                                playerIdToNoOfTokensInPot[id] = p[id];
                            } else if (playerIdToNoOfTokensInPot[id] == 0) {
                                playerIdToNoOfTokensInPot[id] = p[id];
                            }
                        }
                    }else if(operation.type=="EndGame"){
                        //$scope.console("endGame" + JSON.stringify(operations));

                    }
                }
                sharedProperties.setGameState($scope.gameState);
                sharedProperties.setVisibleTo($scope.visibleTo);
                sharedProperties.setPlayerIdToNoOfTokensInPot(playerIdToNoOfTokensInPot);
                //We are not sending verify moves right now
                // Send update UI to everyone
                for(var i = 0; i< sharedProperties.getNumberOfPlayers(); i++){
                    $scope.sendUpdateUi(state.playersIframe[i],playersInfo[i].playerId);
                }
            }else if($scope.msg.type=="VerifyMoveDone"){
                $scope.console("Here "+state.playersIframe.length);
                $scope.sendUpdateUi(window, updateUIPlayerId);
            }
        });
    };

    //Listener for changes from the service
    $scope.$on('gameUrl.update',function(event,newUrl){
        $scope.console("Receiving: "+ newUrl);
        $scope.gameUrl = newUrl;
        $scope.console("Game URL is "+ $scope.gameUrl+ " "+ sharedProperties.getNumberOfPlayers());
        //Listen for events from the game
        //var source = new EventSource($scope.gameUrl);
        noPlayers = sharedProperties.getNumberOfPlayers();
        playersInfo = sharedProperties.getPlayersInfo();
        window.parent.addEventListener('message', handleCallback, false);
        $scope.makeFrames(noPlayers,newUrl);
    });
};
app.controller(controllers);