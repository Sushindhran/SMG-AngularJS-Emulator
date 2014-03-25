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
        getNumberOfPlayers: function(){
            return numberOfPlayers;
        },
        setNumberOfPlayers: function(noPlayers){
            numberOfPlayers = noPlayers;
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

    $scope.setUrl = function (url, noOfPlayers) {
        sharedProperties.setNumberOfPlayers(noOfPlayers);
        sharedProperties.setGameUrl(url);

        $scope.makeFrames(noOfPlayers);
    };

    $scope.makeFrames = function (noOfPlayers) {
        for(var i = 0; i < noOfPlayers; i++) {
            parent = document.getElementById("frames")
            ifrm = document.createElement("IFRAME");
            ifrm.setAttribute("src", sharedProperties.getGameUrl());
            ifrm.setAttribute("id","frame"+i);
            ifrm.style.width = 640 + "px";
            ifrm.style.height = 480 + "px";
            parent.insertBefore(ifrm);
            //sharedProperties.state.playersIframe[i] = ifrm;
        }
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
    var state = sharedProperties.getState();
    var noPlayers;
    var playersInfo;
    var lastMovePlayer;
    var lastGameState;
    var lastMove;
    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n";
    };

    //to be modified
    $scope.send = function(source, message){
        $scope.console("Sending: "+ JSON.stringify(message));
        source.postMessage(message,"*");
    };

    //To be modified
    $scope.sendGameState =  function(){
        for(var i=0; i<2;i++){
            $scope.send(state.playersIframe[i], {"type": "StartGame", "state":state.gameState,"yourPlayerId": i, "playerIds":playerIds})
        }
    };

    /*new UpdateUI(yourPlayerId, playersInfo,
     gameState.getStateForPlayerId(yourPlayerId),
     lastGameState == null ? null : lastGameState.getStateForPlayerId(yourPlayerId),
     lastMove, lastMovePlayerId, gameState.getPlayerIdToNumberOfTokensInPot()));
     */
    $scope.updateUI = function(){
        var updateui = {"type": "UpdateUI", "playersInfo":playersInfo, "gameState": sharedProperties.getGameState(),"lastGameState":lastGameState, "lastMove": lastMove};
        for(var i=0; i<noPlayers;i++){
            $scope.send(state.playersIframe[i], updateui);
        }
    }

    $scope.verifyMove =  function(){

    }

    $scope.test = function() {
        $scope.send(window,{"noOfPlayers":2})
    };


    //Function that shuffles the keys and returns the shuffled set
    $scope.shuffle =  function(keys){
        var keysCopy = keys.slice();
        var result = [];
        while(keysCopy.length<1){
            var index = Math.floor(Math.random()*keysCopy.length);
            keysCopy.splice(index,1);
            result.push(index);
        }
        return result;
    };

    //Function that handles the callback and mutates the state.
    var handleCallback = function (msg) {
        $scope.$apply(function () {

            //Get the data from the JSON
            $scope.msg = JSON.parse(msg.data);

            //Display the message on the console
            $scope.console("Receiving: "+ JSON.stringify($scope.msg));

            if($scope.msg.type == "GameReady"){
                $scope.console("GameReady ");
                //Push the source for the event into the state
                state.playersIframe.push(msg.source);

                if(state.playersIframe.length==noPlayers){
                    $scope.console("Send UpdateUI");
                    sharedProperties.setGameState({});
                    $scope.updateUI();
                }
            }else if($scope.msg.type == "MoveDone"){

                var operations =  $scope.msg.operations;
                for (var i = 0; i < operations.length; i++) {
                    var operation = operations[i];
                    //Check for all types of Operations
                    if (operation.type = "Set") {
                        $scope.gameState[operation.key] = operation.value;
                        $scope.visibleTo[operation.key] = operation.visibleToPlayerIds;
                    }else if(operation.type = "SetRandomInteger"){
                        var key = operation.key;
                        var from = operation.from;
                        var to  = operation.to;
                        //Random number is the value
                        var value = Math.floor((Math.random()*(to-from))+from);
                        $scope.gameState[operation.key] =  value;
                        $scope.visibleTo = "ALL";
                    }else if(operation.type = "SetVisibility"){
                        $scope.visibleTo[operation.key] = operation.visibleToPlayerIds;
                    }else if(operation.type = "Delete"){
                        var key = operation.key;
                        //indexOf Will not work in some versions of IE. Don't care though
                        //Remove from the gameState array
                        var index = $scope.gameState.indexOf(key);
                        if(index>-1){
                            $scope.gameState.splice(index, 1);
                        }
                        //Remove from visibleTo array
                        index = $scope.visibleTo.indexOf(key);
                        if(index>-1){
                            $scope.gameState.splice(index, 1);
                        }
                    }else if(operation.type = "Shuffle"){
                        var keys = operation.keys;
                        var shuffledKeys = $scope.shuffle(keys);
                        var oldGameState = $scope.gameState.slice();
                        var oldVisibleTo = $scope.visibleTo.slice();
                    }else if(operation.type = "AttemptChangeTokens"){

                    }
                }
                sharedProperties.setGameState($scope.gameState);
                sharedProperties.setVisibleTo($scope.visibleTo);
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
        window.parent.addEventListener('message', handleCallback, false);
    });
};

app.controller(controllers);