(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/bubbly.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            WinJS.Utilities.query("#myCanvas").listen("click", selectBubbles, false);
            WinJS.Utilities.query("#newGameButton").listen("click", newGame, false);
            // start new game
            newGame();
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        }
    });


    /*global constants*/
    var COLUMNS = 15; //number of columns of the board
    var ROWS = 8; // number of rows of the board
    var RADIUS = 25; //how big the bubbles are 
    var CANVASWIDTH = COLUMNS * 2 * RADIUS; //width of the canvas
    var CANVASHEIGHT = ROWS * 2 * RADIUS; //height of the canvas

    /*global variables*/
    var timerCount; //counter variables
    var timeOut;
    var timerOn;

    var board; //main board of the game 
    var selectedBubbles; //the currently selected group of bubbles
    var playing; //state of the game 

    /* 
      input: n/a
      output: stirng of a random color 
      description: returns a random color among 5 (red, blue, green, gold, purple
    */
    function randomColor() {
        var rand = Math.floor(Math.random() * 5);
        if (rand == 0)
            return "red";
        else if (rand == 1)
            return "blue";
        else if (rand == 2)
            return "green";
        else if (rand == 3)
            return "gold";
        else if (rand == 4)
            return "purple";
    }

    /*
      input: x, y
      output: n/a
      description: draws a circle of color defined by the index x, y in board[][]
    */
    function drawBubble(x, y) {
        var color = board[x][y];
        if (color == "white")
            return;

        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.shadowColor = "black";
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * 2 * RADIUS + RADIUS, y * 2 * RADIUS + RADIUS, RADIUS, 0 * Math.PI, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    /*
      input: n/a
      output: n/a
      description: starts a new game by defining canvas width and height. end the 
                   previous game first and initialize the board. Draw the board and
                   resets the timer, score, and total score
    */
    function newGame() {
        var canvas = document.getElementById("myCanvas");
        canvas.width = CANVASWIDTH;
        canvas.height = CANVASHEIGHT;
        endGame();
        initBoard();
        playing = true;
        drawBoard();
        var score = document.getElementById("score");
        var totalScore = document.getElementById("totalScore");
        score.innerHTML = "0";
        totalScore.innerHTML = "0";
        timerCount = 0;
        document.getElementById("timer").innerHTML = "0";
    }

    /* 
      input: n/a
      output: the game state global variable 'playing'
      description: scans the board to check if there's at least two bubbles
               that have the same color and are adjacent to each other
    */
    function checkGameState() {
        var gameStatus = document.getElementById("gameStatus");

        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 0; y < ROWS; y++) {
                var me = board[x][y];
                if (me == "white")
                    continue;
                //up
                if (y - 1 >= 0 && me == board[x][y - 1])
                    return (playing = true);
                //right
                if (x + 1 < COLUMNS && me == board[x + 1][y])
                    return (playing = true);
                //down
                if (y + 1 < ROWS && me == board[x][y + 1])
                    return (playing = true);
                //left
                if (x - 1 >= 0 && me == board[x - 1][y])
                    return (playing = true);
            }
        }
        endGame();
        return (playing = false);
    }

    /*
      input: n/a
      output: n/a 
      description: if the game is determined to have ended by checkGameState()
               this function will be called to stop the timer, and make
               make the player name input and submit button visible
    */
    function endGame() {
        drawEndGameInfo();
        clearTimeout(timeOut);
        timerOn = false;
    }

    /* 
      input: n/a 
      output: n/a 
      description: if the game is determined to have ended by checkGameState()
               this function will be called to draw on the canvas to let
               the user know the game has ended and prompt them to enter 
               their name below the board with a message 
    */
    function drawEndGameInfo() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.shadowColor = "white";
        ctx.shadowBlur = 50;
        ctx.fillStyle = "black";
        ctx.font = "100px Arial";
        var text = "GAME OVER";
        var textWidth = ctx.measureText(text).width;
        ctx.fillText(text, CANVASWIDTH / 2 - textWidth / 2, CANVASHEIGHT / 2);
        ctx.font = "30px Arial";
        text = "please input player info";
        textWidth = ctx.measureText(text).width;
        ctx.fillText(text, CANVASWIDTH / 2 - textWidth / 2, CANVASHEIGHT * 2 / 3);
        text = "below and submit score";
        textWidth = ctx.measureText(text).width;
        ctx.fillText(text, CANVASWIDTH / 2 - textWidth / 2, CANVASHEIGHT * 3 / 4);
    }

    /*
      input: n/a
      output: n/a 
      description: populate the board with random colors. Overwrites any
               existing data.
    */
    function initBoard() {
        selectedBubbles = new Array();
        board = new Array(COLUMNS);
        for (var x = 0; x < COLUMNS; x++)
            board[x] = new Array(ROWS);
        for (var x = 0; x < COLUMNS; x++)
            for (var y = 0; y < ROWS; y++)
                board[x][y] = randomColor();
    }

    /* 
      input: n/a
      output: n/a
      description: clear the canvas and redraw only the bubble. This gives 
               the player visual clue that the previous selection 
                   has been cleared or bubbles have been removed
    */
    function clearBoard() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
    }

    /*
      input: n/a
      output: n/a
      description: called moveColumLeft(),  gravity(), and drawBoard to
               reorganize the board when a column has been cleared
               or when bubbles need to move downward
    */
    function reorganizeBoard() {
        moveColumLeft();
        gravity();
        drawBoard();
    }

    /*
      input: n/a
      output: n/a
      description: detects if any column has been cleared and move all 
               column to the right of that left to fill the column
    */
    function moveColumLeft() {
        var moveLeft = true;
        for (var x = 13; x >= 0; x--) {
            for (var y = 7; y >= 0; y--) {
                if (board[x][y] != "white") {
                    moveLeft = false;
                    break;
                }
            }
            //move to left 
            if (moveLeft) {
                for (var i = x; i < 14; i++) {
                    for (var y = 0; y < ROWS; y++) {
                        board[i][y] = board[i + 1][y];
                        board[i + 1][y] = "white";
                    }
                }
            }
            moveLeft = true;
        }
    }

    /*
      input: n/a
      output: n/a
      description: drops button down ward 
    */
    function gravity() {
        //gravity effect
        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 7; y >= 0; y--) {
                if (board[x][y] == "white") {
                    var i;
                    for (i = y; i >= 0; i--) {
                        if (board[x][i] != "white")
                            break;
                    }
                    if (board[x][i] != null) {
                        board[x][y] = board[x][i];
                        if (y != i)
                            board[x][i] = "white";
                    }
                }
            }
        }
    }

    /*
      input: n/a
      output: n/a
      description: draws the board defined by board[][]
    */
    function drawBoard() {
        clearBoard();
        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 0; y < ROWS; y++) {
                drawBubble(x, y);
            }
        }
    }

    /* 
      input: n/a
      output: n/a
      description: take user mouse input and locate where in the canvas the player
               has clicked and figure out if the neighbouring colors are the same
               by calling findNieghbour(...); If the bubbles have already been 
               selected previously, remove the bubbles and update the total score
    */
    function selectBubbles(event) {
        if (board == null || !playing)
            return;

        if (!timerOn) {
            timerOn = true;
            startTimer();
        }
        drawBoard();
        var cord = canvasMouseCordinates(event);
        var x = cord.x; //parseInt(event.clientX/(2*RADIUS));
        var y = cord.y; //parseInt(event.clientY/(2*RADIUS));
        var score = document.getElementById("score");

        //don't try to analyzie white
        if (board[x][y] == "white") {
            score.innerHTML = "0";
            selectedBubbles = null;
            return;
        }

        var newBubbles = new Array();
        findNeighbours(newBubbles, x, y);

        if (newBubbles.length < 2) {
            score.innerHTML = "0";
            selectedBubbles = null;
            drawBoard();
            return;
        }
        //if double click, remove bubles 
        if (included(selectedBubbles, newBubbles[0][0], newBubbles[0][1])) {
            for (var i = 0; i < newBubbles.length; i++) {
                var x = newBubbles[i][0];
                var y = newBubbles[i][1];
                board[x][y] = "white";
            }
            var totalScore = document.getElementById("totalScore");
            totalScore.innerHTML = parseInt(totalScore.innerHTML) + newBubbles.length * newBubbles.length;
            selectedBubbles = null;
            reorganizeBoard();
            checkGameState();
        }
        else {
            selectedBubbles = newBubbles;
            score.innerHTML = newBubbles.length * newBubbles.length;
        }

    }

    /*
      input: array containing cordinates of bubbles, 
             player selected bubble cordinates (x,y)
      output: n/a
      description: recurssive call that keeps on passing the 'array' to update
                   all the neighbouring bubbles of the same color. Returns when 
                   base case (not same color) is met. Traverses the board in the 
               sequence of up, right, down, left. 
    
               Also draws the borders at the same time.
    */
    function findNeighbours(array, x, y) {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        var neighbour = new Array(2);
        var color = board[x][y];

        //include self 
        neighbour = [x, y];
        array.push(neighbour);
        //up neighbour
        if (!included(array, x, y - 1)) {
            if ((y - 1 >= 0) && (neighbour = sameColor(color, x, y - 1)) != null)
                findNeighbours(array, x, y - 1);
            else {
                ctx.beginPath();
                ctx.moveTo(x * 2 * RADIUS, y * 2 * RADIUS);
                ctx.lineTo(x * 2 * RADIUS + 2 * RADIUS, y * 2 * RADIUS);
                ctx.stroke();
                ctx.closePath();
            }
        }
        //right
        if (!included(array, x + 1, y)) {
            if ((x + 1 < COLUMNS) && (neighbour = sameColor(color, x + 1, y)) != null)
                findNeighbours(array, x + 1, y);
            else {
                ctx.beginPath();
                ctx.moveTo(x * 2 * RADIUS + 2 * RADIUS, y * 2 * RADIUS);
                ctx.lineTo(x * 2 * RADIUS + 2 * RADIUS, y * 2 * RADIUS + 2 * RADIUS);
                ctx.stroke();
                ctx.closePath();
            }
        }
        //down
        if (!included(array, x, y + 1)) {
            if ((y + 1 < ROWS) && (neighbour = sameColor(color, x, y + 1)) != null)
                findNeighbours(array, x, y + 1);
            else {
                ctx.beginPath();
                ctx.moveTo(x * 2 * RADIUS, y * 2 * RADIUS + 2 * RADIUS);
                ctx.lineTo(x * 2 * RADIUS + 2 * RADIUS, y * 2 * RADIUS + 2 * RADIUS);
                ctx.stroke();
                ctx.closePath();
            }
        }
        //left
        if (!included(array, x - 1, y)) {
            if ((x - 1 >= 0) &&
            (neighbour = sameColor(color, x - 1, y, x, y)) != null)
                findNeighbours(array, x - 1, y);
            else {
                ctx.beginPath();
                ctx.moveTo(x * 2 * RADIUS, y * 2 * RADIUS);
                ctx.lineTo(x * 2 * RADIUS, y * 2 * RADIUS + 2 * RADIUS);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
    /*
      input: current color, neighbour cordinates (x,y)
      output: returns neighbour if same color, else null
      description: helper function to determine if the current bubble has
               the same color as its neighbourhg (x,y)
    */
    function sameColor(color, x, y) {
        var neighbour = new Array(2);
        if (color == board[x][y]) {
            neighbour = [x, y];
            return neighbour;
        }
        else
            return null;
    }

    /*
      input: array to check against, cordinate(x,y)
      output: null, true, or false
      description: returns null if the array is null; 
                   returns true if the array contains the cordinate (x,y)
               returns false if the array does not contain the cordinate(x,y)
    */
    function included(array, x, y) {
        if (array == null)
            return;

        for (var i = 0; i < array.length; i++) {
            if (array[i][0] == x && array[i][1] == y)
                return true;
        }

        return false;
    }

    /*
      input: n/a
      output: n/a
      description: starts the timer and increment counter
    */
    function startTimer() {
        document.getElementById("timer").innerHTML = timerCount;
        timerCount++;
        timeOut = setTimeout(function () {
            startTimer();
        }, 1000);
    }

    /*
      input: event
      output: cordinate (x,y)
      description: takes in the (click) event and determine where on the canvas
               the user clicked and return the cordiantes(x,y)
    */
    function canvasMouseCordinates(event) {
        var x;
        var y;
        var canvas = document.getElementById("myCanvas");
        if (event.pageX || event.pageY) {
            x = event.pageX;
            y = event.pageY;
        }
        else {
            x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        x = parseInt(x / (2 * RADIUS));
        y = parseInt(y / (2 * RADIUS));

        return { x: x, y: y };
    }

})();