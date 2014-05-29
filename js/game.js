(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/game.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var bubbly = new Bubbly();
            WinJS.Utilities.query("#myCanvas").listen("click", bubbly.selectBubbles, false);
            WinJS.Utilities.query("#refreshBtn").listen("click", function () { getGameData(bubbly, 0, options.username); }, false);

            getGameData(bubbly, 0, options.username);
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        }
    });

    function getGameData(bubbly, time, username) {
        if (time == null)
            time = 0;
        setTimeout(function () {
            WinJS.xhr({
                type: "GET",
                url: "http://localhost:8081/bubbly/join/" + username,
                responseType: "json",
                headers: { "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT" },
            }).done(
                function completed(result) {
                    if (result.status === 200) {
                        var data = JSON.parse(result.response);
                        var gameState = data.gameState;
                        var user = data.user;
                        setGameClock(gameState.remainingTime, bubbly);
                        bubbly.newGame(gameState.board);
                        writeDebug(gameState);
                    }
                },
                function error(result) {

                }
            );
        }, time);
    }

    function postGameData(bubbly, time) {
        WinJS.xhr({
            type: "POST",
            url: "http://localhost:8081/bubbly/report",
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
                    }
                },
                function error(result) {

                }
            );
    }

    var clock;
    var counter = 1;
    function setGameClock(remainingTime, bubbly) {
        if (remainingTime < 0)
            remainingTime = 0;

        remainingTime = Math.ceil(remainingTime / 1000) * 1000;

        if (clock == null) {
            clock = setInterval(function () {
                writeDebug({ remainingTime: (remainingTime / 1000 - counter) + " seconds left" });
                counter++;
            }, 1000)
        }

        setTimeout(function () {
            console.log("time out, game ended, send score");
            getGameData(bubbly, 5000);
            clearInterval(clock);
            clock = null;
            counter = 1;
            bubbly.endGame();
            postGameData(bubbly, 0);
        }, remainingTime);
    }

    function writeDebug(data) {
        var message = "Remaining Time: " + data.remainingTime +
                      "\nMessage: " + data.message +
                      "\nBoard Id: " + data.boardId;
        document.getElementById("gameData").innerText = message;
        //console.log(message);
    }
})();