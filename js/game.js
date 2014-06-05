(function () {
    "use strict";
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;
    var url = "http://node-express-env-3iecs28p3q.elasticbeanstalk.com"; //http://localhost:8081
    var bubbly; // main game board
    var rBubbly; // replay game board
    var replayBoard;

    WinJS.UI.Pages.define("/pages/game.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            bubbly = new Bubbly("main");
            var gameBoard = document.getElementById("gameBoard");
            var gameScore = document.getElementById("gameScore");
            gameBoard.appendChild(bubbly.boardModule);
            gameScore.appendChild(bubbly.scoreModule);

            rBubbly = new Bubbly("replay");
            replayBoard = document.getElementById("replayBoard");
            var rGameBoard = document.getElementById("rGameBoard");
            var rGameScore = document.getElementById("rGameScore");
            rGameBoard.appendChild(rBubbly.boardModule);
            rGameScore.appendChild(rBubbly.scoreModule);

            getGameData(0);
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            // TODO: Respond to changes in layout.
        }
    });
    
    function getGameData(time) {
        if (bubbly == null)
            return;
        setTimeout(function () {
            WinJS.xhr({
                type: "GET",
                url: url + "/bubbly/join/",
                responseType: "json",
                headers: { "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT" },
            }).done(
                function completed(result) {
                    if (result.status === 200) {
                        var data = JSON.parse(result.response);
                        var gameStatus = data.gameStatus;
                        var user = data.user;
                        setGameClock(gameStatus.remainingTime);
                        localSettings.values["userId"] = gameStatus.userCount;

                        if (gameStatus.gameState == 1) { // playing
                            bubbly.newGame(gameStatus.board);
                            rBubbly.newGame(gameStatus.board);
                            postGameData(gameStatus.remainingTime);
                        }
                        else if (gameStatus.gameState == 2) // calculating 
                            postGameData(0);
                        else // resting
                            getGameSummary(gameStatus.remainingTime);
                        writeDebug(data);
                    }
                },
                function error(gameStatus) {
                }
            );
        }, time);
    }

    function postGameData(time) {
        if (bubbly == null)
            return;
        setTimeout(function () {
            bubbly.endGame();
            WinJS.xhr({
                type: "POST",
                url: url + "/bubbly/report/" + localSettings.values["userId"],
                responseType: "json",
                headers: {
                    "Content-type": "application/json",
                    "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT"
                },
                data: JSON.stringify({
                    score: bubbly.score,
                    moves: bubbly.moves
                })
            }).done(
                    function completed(result) {
                        if (result.status === 200) {
                            var data = JSON.parse(result.response);
                            writeDebug(data);
                            setGameClock(data.gameStatus.remainingTime);
                            getGameSummary(data.gameStatus.remainingTime);
                        }
                    },
                    function error(result) {
                    }
             );
        }, time);
    }

    function getGameSummary(time) {
        if (bubbly == null)
            return;
        setTimeout(function () {
            WinJS.xhr({
                type: "GET",
                url: url + "/bubbly/summary/",
                responseType: "json",
                headers: { "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT" },
            }).done(
                function completed(result) {
                    if (result.status === 200) {
                        var data = JSON.parse(result.response);
                        writeDebug(data);
                        setGameClock(data.gameStatus.remainingTime);
                        getGameData(data.gameStatus.remainingTime);
                        bubbly.replay();
                        if (data.summary != null) {
                            rBubbly.replay(data.summary.bestMoves);
                        }
                    }
                },
                function error(result) {
                }
            );
        }, time);
    }

    var clock;
    var counter = 1;
    function setGameClock(remainingTime) {
        if (remainingTime < 0)
            remainingTime = 0;

        if (clock == null) {
            clock = setInterval(function () {
                document.getElementById("clock").textContent = (remainingTime / 1000 - counter++) + " seconds left";
            }, 1000)
        }

        // end game, reset clock
        setTimeout(function () {
            clearInterval(clock);
            clock = null;
            counter = 1;
            document.getElementById("clock").textContent = 0;
        }, remainingTime);
    }

    function writeDebug(obj) {
        var str = [];
        getDebugMessage(obj, str);
        document.getElementById("gameData").innerText = str.join("\n");
    }

    function getDebugMessage(obj, str) {
        for (var key in obj) {
            if (typeof (obj[key]) == 'object') {
                str.push(key.toUpperCase());
                getDebugMessage(obj[key], str);
            } else {
                str.push(key.toUpperCase() + " --- " + obj[key]);
            }
        }
    }
})();