/**
 * Created by Sushindhran on 4/15/2014.
 */
angular.module('sharedProperties.service',[])
.service('sharedProperties', function ($rootScope) {
    var gameUrl = "";
    var state = {playersIframe : []};
    state.gameState = {};
    state.visibleTo = {};
    state.playerIdToNoOfTokensInPot = {};
    state.lastMove = {};
    var iframes = [];
    var playersInfo = [];
    var numberOfPlayers = 2;
    var height = 600;
    var width = 800;
    var timePerTurn = 0;
    var stateSequence = [];
    var currentPlayer=0;
    var lastMovePlayer = 0;
    var viewerFlag = false;
    var singleWindowMode = false;
    var viewerId = -1;
    var aiId = 0;

    //Function to display messages on the console
    var console = function(message){
        document.getElementById("console").value += message + "\n";
    };

    //Function to broadcast changes to all controllers
    var broadcast = function (identifier, value) {
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
            broadcast('gameState.update',state.gameState);
        },
        getVisibleTo: function(){
            return state.visibleTo;
        },
        setVisibleTo: function(visible){
            state.visibleTo = visible;
            broadcast('visible.update',state.visibleTo);
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
        getHeight : function(){
            return height;
        },
        setHeight : function(h){
            height = h;
        },
        getWidth : function(){
            return width;
        },
        setWidth : function(w){
            width = w;
        },
        getTimePerTurn : function(){
            return timePerTurn;
        },
        setTimePerTurn : function(t){
            timePerTurn = t;
        },
        getFrames : function(){
            return iframes;
        },
        setFrames : function(frames){
            iframes = frames;
        },
        getStateSequence : function(){
            return stateSequence;
        },
        setStateSequence : function(seq){
            stateSequence = seq;
            broadcast('stateSeq.update',stateSequence);
        },
        getCurrentPlayer : function(){
            return currentPlayer;
        },
        setCurrentPlayer : function(pid){
            currentPlayer = pid;
            broadcast('currentPlayer.update',currentPlayer);
        },
        getLastMove : function(){
            return state.lastMove;
        },
        setLastMove : function(move){
            state.lastMove = move;
            broadcast('lastMove.update',state.lastMove);
        },
        getLastMovePlayer : function(){
            return lastMovePlayer;
        },
        setLastMovePlayer : function(player){
            lastMovePlayer = player;
            broadcast('lastMovePlayer.update',state.lastMove);
        },
        isViewerEnabled : function() {
            return viewerFlag;
        },
        getViewerFlag : function(){
            return viewerFlag
        },
        setViewerEnabled : function(viewer) {
            viewerFlag = viewer;
        },
        isSingleWindowMode : function() {
            return singleWindowMode.checked;
        },
        setSingleWindowMode : function(inp) {
            singleWindowMode  = inp;
        },
        getViewerId: function(){
            return viewerId;
        },
        broadcast: broadcast
    };
});
