(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/game.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var bubbly = new Bubbly();
            var gameBoard = document.getElementById("gameBoard");
            var gameScore = document.getElementById("gameScore");
            gameBoard.appendChild(bubbly.boardModule);
            gameScore.appendChild(bubbly.scoreModule);

            getGameData(bubbly, 0);
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            // TODO: Respond to changes in layout.
        }
    });
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;
    var url = "http://node-express-env-3iecs28p3q.elasticbeanstalk.com"; //http://localhost:8081
    function getGameData(bubbly, time) {
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
                            postGameData(bubbly, gameStatus.remainingTime);
                        }
                        else if (gameStatus.gameState == 2) // calculating 
                            postGameData(bubbly, 0);
                        else // resting
                            getGameSummary(bubbly, gameStatus.remainingTime);
                        writeDebug(data);
                    }
                },
                function error(gameStatus) {
                }
            );
        }, time);
    }

    function postGameData(bubbly, time) {
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
                            getGameSummary(bubbly, data.gameStatus.remainingTime);
                        }
                    },
                    function error(result) {
                    }
             );
        }, time);
    }

    function getGameSummary(bubbly, time) {
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
                        getGameData(bubbly, data.gameStatus.remainingTime);
                        if (data.summary != null)
                            bubbly.replay(data.summary.bestMoves);
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