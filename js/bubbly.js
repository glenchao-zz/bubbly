function Bubbly(name) {
    var _this = this;

    // Private variables
    var board; //main board of the game 
    var backupBoard;
    var replayTimer;
    var bPlaying = false; //boolean
    var bReplayMode = false; //boolean
    var selectedBubbles// array

    // Constant variables
    var COLUMNS = 15; //number of columns of the board
    var ROWS = 8; // number of rows of the board
    var radius = 25; //how big the bubbles are 
    var diameter = radius * 2;
    var canvasWidth = COLUMNS * diameter; //width of the canvas
    var canvasHeight = ROWS * diameter; //height of the canvas

    // Public variables
    this.moves = new Array(); // array
    this.score = 0;
    this.boardModule = document.createElement("canvas");
    this.boardModule.id = name + "_canvas";
    this.scoreModule = document.createElement("div");
    this.scoreModule.id = name + "_score";

    this.boardModule.addEventListener("click", selectBubbles, false);
    this.boardModule.width = canvasWidth;
    this.boardModule.height = canvasHeight;

    var boardCtx = this.boardModule.getContext("2d");

    // Starts a new game by defining canvas width and height. End the previous game first and initialize the board.
    this.newGame = function (boardArray) {
        // reset game variables
        bPlaying = true;
        bReplayMode = false;
        selectedBubbles = new Array();
        clearInterval(replayTimer);
        replayTimer = null;
        _this.moves = new Array();
        _this.score = 0;

        initBoard(boardArray);
        resizeBoard(1);
        drawBoard();
    };

    //Take user mouse input and locate where in the canvas the player
    //has clicked and figure out if the neighbouring colors are the same
    //by calling findNieghbour(...); If the bubbles have already been 
    //selected previously, remove the bubbles and update the total score
    function selectBubbles(event) {
        console.log(name + " tried to select bubble");
        if (board == null || !bPlaying || bReplayMode)
            return;
        // refreshes the board
        drawBoard();

        var cord = canvasMouseCordinates(event);
        var x = cord.x;
        var y = cord.y;

        // don't try to analyzie white
        if (board[x][y] == "white") {
            return;
        }

        if (selectedBubbles.length < 2) {
            console.log(name + "  selected bubbles");
            // First selection
            selectedBubbles = new Array();
            findNeighbours(selectedBubbles, x, y); //recursive call

            if (selectedBubbles.length < 2) {
                selectedBubbles = new Array();
                drawBoard();
            }
        }
        else if (included(selectedBubbles, x, y)) {
            // Clears the bubbles and update score
            _this.moves.push(selectedBubbles);
            clearBubbles(selectedBubbles);
            reorganizeBoard();
            checkGameState();
            updateScore(selectedBubbles);
            selectedBubbles = new Array(); // clear
        }
        else {
            // Selected another set of bubbles
            selectedBubbles = new Array();
            findNeighbours(selectedBubbles, x, y);
        }
    };

    function clearBubbles(bubblesToClear) {
        for (var i = 0; i < bubblesToClear.length; i++) {
            x = bubblesToClear[i].x;
            y = bubblesToClear[i].y;
            board[x][y] = "white";
        }
    }

    // Ends the game
    this.endGame = function () {
        bPlaying = false;

        // draw end game info
        boardCtx.shadowColor = "white";
        boardCtx.shadowBlur = 20;
        boardCtx.fillStyle = "black";
        boardCtx.font = "30px Helvetica";
        var text = "GAME OVER";
        var textWidth = boardCtx.measureText(text).width;
        boardCtx.fillText(text, canvasWidth / 2 - textWidth / 2, canvasHeight / 2);
    }

    // Populate the board with random colors. Overwrites any existing data.
    function initBoard(boardArray) {
        board = new Array(COLUMNS);
        for (var x = 0; x < COLUMNS; x++) {
            board[x] = new Array(ROWS);
        }
        if (Boolean(boardArray)) {
            for (var x = 0; x < COLUMNS; x++)
                for (var y = 0; y < ROWS; y++) {
                    board[x][y] = boardArray[y + x * ROWS];
                }
        }
        backupBoard = board.clone();
    }

    // Draws the board defined by board[][]
    function drawBoard() {
        // clear board
        boardCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // draw the bubbles
        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 0; y < ROWS; y++) {
                var color = board[x][y];
                if (color == "white")
                    continue;

                boardCtx.shadowColor = color;
                boardCtx.shadowBlur = 0;
                boardCtx.fillStyle = color;
                boardCtx.beginPath();
                boardCtx.arc(x * diameter + radius, y * diameter + radius, radius, 0 * Math.PI, 2 * Math.PI);
                boardCtx.closePath();
                boardCtx.fill();
            }
        }
    }

    function resizeBoard(scale) {
        if (scale != null) {
            radius = 25 * scale; //how big the bubbles are 
            diameter = radius * 2;
            canvasWidth = COLUMNS * diameter; //width of the canvas
            canvasHeight = ROWS * diameter; //height of the canvas
            _this.boardModule.width = canvasWidth;
            _this.boardModule.height = canvasHeight;
        }
    }
    // Scans the board to check if there's at least two bubbles 
    // that have the same color and are adjacent to each other
    function checkGameState() {
        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 0; y < ROWS; y++) {
                var me = board[x][y];
                if (me == "white")
                    continue;
                //up
                if (y - 1 >= 0 && me == board[x][y - 1])
                    return (bPlaying = true);
                //right
                if (x + 1 < COLUMNS && me == board[x + 1][y])
                    return (bPlaying = true);
                //down
                if (y + 1 < ROWS && me == board[x][y + 1])
                    return (bPlaying = true);
                //left
                if (x - 1 >= 0 && me == board[x - 1][y])
                    return (bPlaying = true);
            }
        }
        _this.endGame();
        return (bPlaying = false);
    }

    // Called moveColumLeft(),  gravity(), and drawBoard to
    // reorganize the board when a column has been cleared
    // or when bubbles need to move downward
    function reorganizeBoard() {
        // move colum left
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

        // drop bubbles downward
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

        drawBoard();
    }

    function updateScore(bubblesToClear) {
        _this.score += Math.pow(bubblesToClear.length, 2);
        gameScore.textContent = "Score: " + _this.score;
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
        var color = board[x][y];

        //include self 
        array.push({ x: x, y: y });

        //up neighbour
        if (!included(array, x, y - 1)) {
            if ((y - 1 >= 0) && color == board[x][y - 1])
                findNeighbours(array, x, y - 1);
            else {
                drawBorder(x * diameter,
                           y * diameter,
                           x * diameter + diameter,
                           y * diameter);
            }
        }
        //right
        if (!included(array, x + 1, y)) {
            if ((x + 1 < COLUMNS) && color == board[x + 1][y])
                findNeighbours(array, x + 1, y);
            else {
                drawBorder(x * diameter + diameter,
                           y * diameter,
                           x * diameter + diameter,
                           y * diameter + diameter);
            }
        }
        //down
        if (!included(array, x, y + 1)) {
            if ((y + 1 < ROWS) && color == board[x][y + 1])
                findNeighbours(array, x, y + 1);
            else {
                drawBorder(x * diameter,
                           y * diameter + diameter,
                           x * diameter + diameter,
                           y * diameter + diameter);
            }
        }
        //left
        if (!included(array, x - 1, y)) {
            if ((x - 1 >= 0) && color == board[x - 1][y])
                findNeighbours(array, x - 1, y);
            else {
                drawBorder(x * diameter,
                           y * diameter,
                           x * diameter,
                           y * diameter + diameter);
            }
        }
    }

    function drawBorder(startX, startY, endX, endY) {
        boardCtx.strokeStyle = "white";
        boardCtx.beginPath();
        boardCtx.moveTo(startX, startY);
        boardCtx.lineTo(endX, endY);
        boardCtx.stroke();
        boardCtx.closePath();
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
            if (array[i].x == x && array[i].y == y)
                return true;
        }

        return false;
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
        if (event.pageX || event.pageY) {
            x = event.pageX;
            y = event.pageY;
        }
        else {
            x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        x -= _this.boardModule.offsetLeft;
        y -= _this.boardModule.offsetTop;

        x = parseInt(x / (diameter));
        y = parseInt(y / (diameter));

        return { x: x, y: y };
    }

    // Replay
    this.replay = function(moves) {
        if ((moves == null || moves.length == 0) && _this.moves.length == 0)
            return;
        bReplayMode = true;
        bPlaying = false;
        _this.score = 0;

        board = backupBoard.clone();
        resizeBoard(0.5);
        drawBoard();
        
        if (moves == null)
            moves = _this.moves;
        var moveCounter = 0;
        replayTimer = setInterval(function () {
            if (moveCounter == moves.length) {
                _this.endGame();
                clearInterval(replayTimer);
                replayTimer = null;
                return;
            }

            clearBubbles(moves[moveCounter]);
            reorganizeBoard();
            updateScore(moves[moveCounter]);
            moveCounter++;
        }, 500);
    }
}