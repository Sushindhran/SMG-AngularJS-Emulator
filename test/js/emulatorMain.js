/**
 * Created by
 * Sushindhran
 * Shwetank
 * on 22/03/14.
 */
var app = angular.module('ajsEmulator', ['popup.directives','editState.directives','loadState.directives','saveState.directives','sharedProperties.service']);


//Holds all the controllers used
var controllers = {};

//Url controller
controllers.urlCtrl = function($scope, sharedProperties){
    $scope.height = sharedProperties.getHeight();
    $scope.width = sharedProperties.getWidth();
    $scope.noOfplayers = sharedProperties.getNumberOfPlayers();
    $scope.timePerTurn = sharedProperties.getTimePerTurn();
    $scope.viewerFlag = sharedProperties.getViewerFlag();
    $scope.singleWindowMode = sharedProperties.isSingleWindowMode();

    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n\n";
    };

    $scope.createPlayersInfo = function (noOfPlayers) {
        var list = [];
        var i = 0, playerId = 42;
        for(i=0; i< noOfPlayers; i++) {
            playerId += i;
            list = list.concat({"playerId":playerId.toString()});
        }
        sharedProperties.setPlayersInfo(list);
    };

    $scope.setUrl = function (url) {
        sharedProperties.setNumberOfPlayers($scope.noOfplayers);
        $scope.createPlayersInfo($scope.noOfplayers);
        sharedProperties.setHeight($scope.height);
        sharedProperties.setWidth($scope.width);
        sharedProperties.setTimePerTurn($scope.timePerTurn);
        sharedProperties.setViewerEnabled($scope.viewerFlag);
        sharedProperties.setSingleWindowMode($scope.singleWindowMode);
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
    $scope.currentPlayer = 42;
    //variables for all the shared properties to be used
    var state = {playersIframe : []};
    var updateUIPlayerId = 0;
    var noPlayers;
    var playersInfo;
    var lastMovePlayer=0;
    var lastGameState={};
    var lastMove=[];
    var playerIdToNoOfTokensInPot={};
    var timePerTurn = 0;
    var timerCount = 0;
    var count=1;
    var stateArray = []; //Holds all the states the game has received till now.
    var startTimer = false;
    var iframeArray = [];
    var interval;
    var playerId = 42;

    //Values for the state slider
    $scope.min = 0;
    $scope.max = 1;
    $scope.currentStateIndex = 0;

    //Function for the state slider
    $scope.change = function(){
        var updateUIArr = stateArray[$scope.currentStateIndex];
        $scope.console("Current index clicked "+$scope.currentStateIndex);
        $scope.console("Update array length "+stateArray);
        stateArray = stateArray.slice(0,$scope.currentStateIndex);
        sharedProperties.setStateSequence(stateArray);
        $scope.max = $scope.currentStateIndex;
        $scope.console("Max "+$scope.max);
        $scope.sliderTicks();
        document.getElementById("slider").setAttribute("max",$scope.max);
        $scope.currentPlayer = updateUIArr[0];
        sharedProperties.setCurrentPlayer($scope.currentPlayer);
        for (var i = 1; i < updateUIArr.length; i++) {
            //$scope.console("Sending from change"+count);
            if(count<noPlayers){
                updateUIArray.push(updateUIArr[0]);
                updateUIArray.push(updateUIArr[i]);
                count++;
            }else if(count==noPlayers){
                updateUIArray.push(updateUIArr[i]);
                stateArray.push(updateUIArray);
                $scope.max++;
                $scope.sliderTicks();
                $scope.currentStateIndex=$scope.max;
                document.getElementById("slider").setAttribute("max",$scope.max);
                count = 1;
                updateUIArray = [];
            }
            $scope.send(iframeArray[i-1].contentWindow, updateUIArr[i]);
        }
    };

    $scope.sliderTicks=function(){
        var text;
        for(var i=0;i<$scope.max;i++){
            text=text+"<option>"+i+"</option>";
        }
        document.getElementById("tickmarks").innerHTML = text;
    };

    //For the iframe tabs
    $scope.tabs = [];
    $scope.currentTab = 'Player 42';

    $scope.onClickTab = function (tab) {
        $scope.currentTab = tab.title;
        for(var i=0;i<iframeArray.length;i++) {
            if (tab.title==iframeArray[i].getAttribute("id")){
                iframeArray[i].removeAttribute("hidden");
            }else{
                iframeArray[i].setAttribute("hidden",true);
            }
        }
    };

    $scope.isActiveTab = function(title) {
        return title == $scope.currentTab;
    };

    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n\n";
    };

    //to be modified
    $scope.send = function(source, message){
        $scope.console("Sending to Game: \n"+ JSON.stringify(message));
        source.postMessage(message,"*");
    };

    var updateUIArray = [];

    //Function that creates the UpdateUI message and calls the send function
    $scope.sendUpdateUi =  function(source, yourPlayerId){
        var updateUIMessage = {'type': 'UpdateUI', 'yourPlayerId': yourPlayerId.toString(), 'playersInfo': playersInfo,  'state':getStateforPlayerId(yourPlayerId, sharedProperties.getGameState(), sharedProperties.getVisibleTo()),
            'lastState':{},'lastMove':lastMove, 'lastMovePlayerId': lastMovePlayer.toString(), 'playerIdToNumberOfTokensInPot':playerIdToNoOfTokensInPot
        };

        if(count<noPlayers){
            updateUIArray.push(lastMovePlayer);
            updateUIArray.push(updateUIMessage);
            count++;
        }else if(count==noPlayers){
            updateUIArray.push(updateUIMessage);
            if(!sharedProperties.isViewerEnabled()){
                stateArray.push(updateUIArray);
                count = 1;
            }else{
                count++;
            }
            sharedProperties.setStateSequence(stateArray);
            $scope.max++;
            $scope.sliderTicks();
            $scope.currentStateIndex=$scope.max;
            document.getElementById("slider").setAttribute("max",$scope.max);

            updateUIArray = [];
        }
        else if(count==noPlayers+1){
            if(sharedProperties.isViewerEnabled()){
                updateUIArray.push(updateUIMessage);
                stateArray.push(updateUIArray);
            }
            count++;
        }
        $scope.send(source, updateUIMessage);
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
                    $scope.send(state.playersIframe[playerId-42], {"playersInfo": playersInfo, "type": "VerifyMove", "state": getStateforPlayerId(playerId,sharedProperties.getGameState(),sharedProperties.getVisibleTo()), "lastState": lastGameState,
                        "lastMove": lastMove, "lastMovePlayerId": lastMovePlayer, "playerIdToNumberOfTokensInPot": playerIdToNoOfTokensInPot});
                }
            }
        }
    };

    //Function that updates the timer for a move
    $scope.startTimer = function(){
        var timeLeft = (timePerTurn*60) - timerCount;
        timerCount++;
        document.getElementById("timer").innerHTML = timeLeft;
        if(timeLeft==0){
            timerCount=0;
            clearInterval(interval);
            //window.alert("Timeout");
            var endgame;
            if($scope.currentPlayer==42)
                //endgame = {"type":"EndGame","playerIdToScore":{"42":0,"43":1}},"lastMovePlayerId":"42","playerIdToNumberOfTokensInPot":{"42":1000,"43":1000}};
            $scope.gameState.push();
        }
    };

    //Function that shuffles the keys and returns the shuffled set
    $scope.shuffle =  function(keys){
        var keysCopy = keys.slice(0);
        var result = [];
        while(!(keysCopy.length<1)){
            var index = Math.floor(Math.random()*keysCopy.length);
            var removed = keysCopy.splice(index,1);
            result.push(removed);
        }
        return result;
    };

    //Function to copy a state object
    var clone = function(obj) {

        var str = JSON.stringify(obj)
        var copy = JSON.parse(str);
        return copy;
    };

    //Function to get the state for a particular playerId
    var getStateforPlayerId = function(playerId, state, visibleTo){
        var result = {};
        var keys = getKeys(state);
        for(var k=0;k<keys.length;k++){
            var visibleToPlayers = visibleTo[keys[k]];
            var value = null;
            if(visibleToPlayers=="ALL"){
                value = state[keys[k]];
            }
            if(visibleToPlayers.indexOf(playerId)>-1){
                value = state[keys[k]];
            }
            result[keys[k]] = value;
        }
        return result;
    };

    //Making the frames
    $scope.makeFrames = function (noOfPlayers,url) {
        //Hide dom elements
        document.getElementById("label1").setAttribute("hidden", true);
        document.getElementById("label2").setAttribute("hidden", true);
        document.getElementById("label3").setAttribute("hidden", true);
        document.getElementById("label4").setAttribute("hidden", true);
        document.getElementById("label5").setAttribute("hidden", true);
        document.getElementById("label6").setAttribute("hidden", true);
        document.getElementById("label7").setAttribute("hidden", true)
        document.getElementById("urlText").setAttribute("hidden", true);
        document.getElementById("playerText").setAttribute("hidden", true);
        document.getElementById("heightText").setAttribute("hidden", true);
        document.getElementById("widthText").setAttribute("hidden", true);
        document.getElementById("timePerTurn").setAttribute("hidden", true);
        document.getElementById("singleWindow").setAttribute("hidden", true);
        document.getElementById("viewer").setAttribute("hidden", true);
        document.getElementById("fetch").setAttribute("hidden", true);

        document.getElementById("console").removeAttribute("hidden");
        document.getElementById("listener").removeAttribute("hidden");
        document.getElementById("console").removeAttribute("hidden");
        document.getElementById("listener").removeAttribute("hidden");
        // Create frames equal to number of players
        for (var i = 0; i < noOfPlayers; i++) {
            $scope.tabs.push({
                title: 'Player ' + (i + 42)
            });
            parent = document.getElementById("frames");
            ifrm = document.createElement("IFRAME");
            ifrm.setAttribute("src", url);
            ifrm.setAttribute("id", "Player " + (i + 42));

            if (i != 0) {
                ifrm.setAttribute("hidden", true);
            }
            ifrm.style.width = sharedProperties.getWidth() + "px";
            ifrm.style.height = sharedProperties.getHeight() + "px";
            iframeArray.push(ifrm);
            parent.insertBefore(ifrm);
        }

        // Set up viewer tab if viewer is enabled

        if (sharedProperties.isViewerEnabled()) {
            parent = document.getElementById("frames");
            ifrm = document.createElement("IFRAME");
            ifrm.setAttribute("src", url);
            ifrm.setAttribute("id", "Viewer");
            ifrm.setAttribute("hidden", true);
            ifrm.style.width = sharedProperties.getWidth() + "px";
            ifrm.style.height = sharedProperties.getHeight() + "px";
            iframeArray.push(ifrm);
            parent.insertBefore(ifrm);
            $scope.tabs.push({title: "Viewer"})
        }
        sharedProperties.setFrames(iframeArray);
    };

    //Function to get the keys from a JSON object
    var getKeys = function(object){

        var keys = [];

        for(var key in object){
            if(object.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };

    // Function that finds out which player sent the message
    var findMessageSource = function(source) {
        for(var i = 0 ; i < iframeArray.length; i++) {
            if (source === iframeArray[i].contentWindow || source.parent === iframeArray[i].contentWindow){
                return i;
            }
        }
        return -1;
    };
    //Function that handles the callback and mutates the state.
    var handleCallback = function (msg) {

        $scope.$apply(function () {

            //Get the data from the JSON
            $scope.msg = (msg.data);
            //Display the message on the console
            $scope.console("Receiving from Game: "+ ($scope.msg.type));

            if($scope.msg.type == "GameReady"){
                // Send update ui as soon as you receive a game ready.
                $scope.gameState = {};
                var index = findMessageSource(msg.source);
                if(sharedProperties.isViewerEnabled() && index == iframeArray.length-1){
                    $scope.sendUpdateUi(iframeArray[index].contentWindow, sharedProperties.getViewerId());
                }else {
                    $scope.sendUpdateUi(iframeArray[index].contentWindow, playersInfo[index].playerId);
                }
            }else if($scope.msg.type == "MakeMove"){
                playerId = playersInfo[findMessageSource(msg.source)].playerId;
                lastMovePlayer = playerId;
                sharedProperties.setLastMovePlayer(lastMovePlayer);
                var operations =  $scope.msg.operations;
                //$scope.console(JSON.stringify(operations));
                lastMove = (operations);
                var lastGameState = clone($scope.gameState);
                var lastVisibleTo = clone($scope.visibleTo);
                //$scope.console(JSON.stringify(lastGameState));
                for (var i = 0; i < operations.length; i++) {
                    var operation = operations[i];
                    //Check for all types of Operations
                    if(operation.type === "SetTurn"){
                        $scope.console("SetTurn");
                        $scope.currentPlayer = operation.playerId;
                        timerCount = 0;
                        if(operation.numberOfSecondsForTurn!=0){
                            $scope.console("Setting Time Per Turn to "+operation.numberOfSecondsForTurn);
                            timePerTurn = operation.numberOfSecondsForTurn;
                        }
                        if(!startTimer){
                            if(timePerTurn==0){
                                document.getElementById("timerLabel").setAttribute("hidden",true);
                            }else{
                                document.getElementById("timerLabel").removeAttribute("hidden");
                                interval = setInterval(function(){$scope.startTimer()},1000);
                            }
                            startTimer = true;
                        }
                        /*var playeridtoScore = {};
                         for(var i=0;i<noPlayers;i++){
                         var plid = 42+i;
                         if(playerId==plid){
                         plid = plid.toString();
                         playeridtoScore[i]={plid:0};
                         }else{
                         plid = plid.toString();
                         playeridtoScore[i]={plid:1};
                         }
                         }
                         var endgame = {"type":"EndGame","playerIdToScore":{"42":0,"43":1}}],"lastMovePlayerId":"42","playerIdToNumberOfTokensInPot":{"42":1000,"43":1000}};
                         $scope.gameState.push();*/
                    }else if (operation.type === "Set") {
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
                        var oldGameState = clone($scope.gameState);
                        var oldVisibleTo = clone($scope.visibleTo);
                        for(var j=0;j<shuffledKeys.length;j++){
                            var fromKey = keys[j];
                            var toKey = shuffledKeys[j];
                            $scope.gameState[toKey] = oldGameState[fromKey];
                            $scope.visibleTo[toKey] = oldVisibleTo[fromKey];
                        }
                    }else if(operation.type === "AttemptChangeTokens"){
                        var p = operation.playerIdToNumberOfTokensInPot;
                        for( var j = 0; j < sharedProperties.getNumberOfPlayers(); j++){
                            var id;
                            id = playersInfo[j].playerId.toString();
                            if(! playerIdToNoOfTokensInPot.hasOwnProperty(id) ) {
                                playerIdToNoOfTokensInPot[id] = p[id];
                            } else if (playerIdToNoOfTokensInPot[id] == 0) {
                                playerIdToNoOfTokensInPot[id] = p[id];
                            }
                        }
                    }else if(operation.type == "EndGame"){
                        $scope.console("End Game" + JSON.stringify(msg.data));
                    }
                }
                sharedProperties.setGameState($scope.gameState);
                sharedProperties.setVisibleTo($scope.visibleTo);
                sharedProperties.setPlayerIdToNoOfTokensInPot(playerIdToNoOfTokensInPot);
                sharedProperties.setCurrentPlayer($scope.currentPlayer);
                sharedProperties.setLastMove(lastMove);
                //We are not sending verify moves right now
                // Send update UI to everyone

                for(var i = 0; i< sharedProperties.getNumberOfPlayers(); i++){
                    $scope.sendUpdateUi(iframeArray[i].contentWindow,playersInfo[i].playerId);
                }

                // Send Update UI to viewer too if it is enabled
                if(sharedProperties.isViewerEnabled()){
                    $scope.sendUpdateUi(iframeArray[iframeArray.length-1].contentWindow, -1);
                }
            }
        });
    };

    $scope.$on('currentPlayer.update',function(event,playerid){
        $scope.currentPlayer = playerid;
    });

    //Listener for changes from the service
    $scope.$on('gameUrl.update',function(event,newUrl){
        $scope.gameUrl = newUrl;
        $scope.console("Loading Game at "+ $scope.gameUrl);
        $scope.console("Viewer "+ sharedProperties.isViewerEnabled())
        //Listen for events from the game
        //var source = new EventSource($scope.gameUrl);
        noPlayers = sharedProperties.getNumberOfPlayers();
        playersInfo = sharedProperties.getPlayersInfo();
        timePerTurn = sharedProperties.getTimePerTurn();
        window.parent.addEventListener('message', handleCallback, false);
        $scope.makeFrames(noPlayers,newUrl);
        $scope.sliderTicks();
    });
};

controllers.stateCtrl = function($scope, sharedProperties){
    $scope.currentState = sharedProperties.getGameState();
    $scope.iframes = sharedProperties.getFrames();
    $scope.stateSequence =  sharedProperties.getStateSequence();
    $scope.label = "";
    $scope.lastMove=[];
    $scope.updateUIMessage = {};
    $scope.vis = sharedProperties.getVisibleTo;
    var playerId = 0;
    var lastMovePlayer = 0;

    //Function to display messages on the console
    $scope.console = function(message){
        document.getElementById("console").value += message + "\n\n";
    };

    $scope.$on('gameState.update',function(event,state){
        //$scope.console("Game State Update");
        $scope.currentState = state;
    });

    $scope.$on('stateSeq.update',function(event,seq){
        $scope.stateSequence = seq;
    });

    $scope.$on('lastMove.update',function(event,lastMove){
        $scope.lastMove = lastMove;
        //$scope.console("Last Move "+JSON.stringify(lastMove));
        $scope.updateUIMessage = JSON.stringify({'type': 'UpdateUI', 'yourPlayerId': playerId.toString(), 'playersInfo': sharedProperties.getPlayersInfo(),  'state':getStateforPlayerId(playerId, $scope.currentState,$scope.vis),
            'lastState':{},'lastMove':lastMove, 'lastMovePlayerId': lastMovePlayer.toString(), 'playerIdToNumberOfTokensInPot':sharedProperties.getPlayerIdToNoOfTokensInPot()});
        //$scope.console("Last Move "+$scope.updateUIMessage);
    });

    $scope.$on('currentPlayer.update',function(event,pid){
        playerId = pid;
        //$scope.console("Current Player "+pid.toString());
    });

    $scope.$on('visible.update',function(event,visible){
        $scope.vis = visible;
        //$scope.console("Visible "+JSON.stringify(visible));
    });

    $scope.$on('lastMovePlayer.update',function(event,lmp){
        lastMovePlayer = lmp;
        //$scope.console("LastMovePlayer "+JSON.stringify(lmp));
    });

    $scope.sendEditState = function(){
        $scope.console($scope.updateUIMessage);

    };

    $scope.save = function(){
        $scope.console("Saving state");
        localStorage.setItem($scope.label, JSON.stringify($scope.stateSequence));
    };

    $scope.load = function(){
      $scope.stateSequence = localStorage.getItem($scope.label);
      $scope.console("Loaded "+JSON.parse($scope.stateSequence));
        //for (var key in localStorage){
          //  console.log(key)
        //}

      for(var i=0;i<$scope.stateSequence.length;i++){
          var updateUIArr = ($scope.stateSequence[i]);
          var player = updateUIArr[0];
          $scope.console("UpdateUIArr "+player);
          if(player==0){
              $scope.console("Breaking out");
              continue;
          }
          $scope.console(player);
          $scope.currentPlayer = player;
          sharedProperties.setCurrentPlayer(player);

          for(var j=1;j<updateUIArr.length;j++){
             $scope.send($scope.iframes[i].contentWindow, JSON.parse(updateUIArr[i]));
          }
      }
    };

    //Function to get the state for a particular playerId
    var getStateforPlayerId = function(playerId, state, visibleTo){
        var result = {};
        var keys = getKeys(state);

        for(var k=0;k<keys.length;k++){
            var visibleToPlayers = visibleTo[keys[k]];
            //$scope.console("Visible to "+visibleTo);
            var value = null;
            if(visibleToPlayers=="ALL"){
                value = state[keys[k]];
            }
            if(visibleToPlayers.indexOf(playerId)>-1){
                value = state[keys[k]];
            }
            result[keys[k]] = value;
        }
        return result;
    };

    //Function to get the keys from a JSON object
    var getKeys = function(object){
        var keys = [];

        for(var key in object){
            if(object.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };

    $scope.send = function(source, message){
        $scope.console("Sending to Game: \n"+ JSON.stringify(message));
        source.postMessage(message,"*");
    };
};

app.controller(controllers);

