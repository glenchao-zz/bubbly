function Bubbly() {
    var _this = this;

    // Constant variables
    var COLUMNS = 15; //number of columns of the board
    var ROWS = 8; // number of rows of the board
    var RADIUS = 25; //how big the bubbles are 
    var DIAMETER = RADIUS * 2;
    var CANVASWIDTH = COLUMNS * DIAMETER; //width of the canvas
    var CANVASHEIGHT = ROWS * DIAMETER; //height of the canvas

    // Public variables
    this.moves; // array
    this.score = 0;
    this.boardModule = document.createElement("canvas");
    this.scoreModule = document.createElement("div");

    // Private variables
    var board; //main board of the game 
    var playing; //boolean
    var selectedBubbles// array
    var ctx = this.boardModule.getContext("2d");
    this.boardModule.addEventListener("click", selectBubbles, false);
    this.boardModule.width = CANVASWIDTH;
    this.boardModule.height = CANVASHEIGHT;

    // Starts a new game by defining canvas width and height. End the previous game first and initialize the board.
    this.newGame = function (boardArray) {
        // reset game variables
        playing = true;
        selectedBubbles = new Array();
        _this.moves = new Array();
        _this.score = 0;

        initBoard(boardArray);
        drawBoard();
    };

    //Take user mouse input and locate where in the canvas the player
    //has clicked and figure out if the neighbouring colors are the same
    //by calling findNieghbour(...); If the bubbles have already been 
    //selected previously, remove the bubbles and update the total score
    function selectBubbles(event) {
        if (board == null || !playing)
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
            for (var i = 0; i < selectedBubbles.length; i++) {
                x = selectedBubbles[i].x;
                y = selectedBubbles[i].y;
                board[x][y] = "white";
            }
            _this.moves.push(selectedBubbles);
            reorganizeBoard();
            checkGameState();
            updateScore();
            selectedBubbles = new Array(); // clear
        }
        else {
            // Selected another set of bubbles
            selectedBubbles = new Array();
            findNeighbours(selectedBubbles, x, y);
        }
    };

    // Ends the game
    this.endGame = function () {
        playing = false;

        // draw end game info
        ctx.shadowColor = "white";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "black";
        ctx.font = "30px Helvetica";
        var text = "GAME OVER";
        var textWidth = ctx.measureText(text).width;
        ctx.fillText(text, CANVASWIDTH / 2 - textWidth / 2, CANVASHEIGHT / 2);
    }

    // Populate the board with random colors. Overwrites any existing data.
    function initBoard(boardArray) {
        board = new Array(COLUMNS);
        for (var x = 0; x < COLUMNS; x++)
            board[x] = new Array(ROWS);
        if (Boolean(boardArray)) {
            for (var x = 0; x < COLUMNS; x++)
                for (var y = 0; y < ROWS; y++)
                    board[x][y] = boardArray[y + x * ROWS];
        }
    }

    // Draws the board defined by board[][]
    function drawBoard() {
        // clear board
        ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);

        // draw the bubbles
        for (var x = 0; x < COLUMNS; x++) {
            for (var y = 0; y < ROWS; y++) {
                var color = board[x][y];
                if (color == "white")
                    continue;

                ctx.shadowColor = color;
                ctx.shadowBlur = 0;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x * DIAMETER + RADIUS, y * DIAMETER + RADIUS, RADIUS, 0 * Math.PI, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            }
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
        _this.endGame();
        return (playing = false);
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

    function updateScore() {
        _this.score += Math.pow(selectedBubbles.length, 2);
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
                drawBorder(x * DIAMETER,
                           y * DIAMETER,
                           x * DIAMETER + DIAMETER,
                           y * DIAMETER);
            }
        }
        //right
        if (!included(array, x + 1, y)) {
            if ((x + 1 < COLUMNS) && color == board[x + 1][y])
                findNeighbours(array, x + 1, y);
            else {
                drawBorder(x * DIAMETER + DIAMETER,
                           y * DIAMETER,
                           x * DIAMETER + DIAMETER,
                           y * DIAMETER + DIAMETER);
            }
        }
        //down
        if (!included(array, x, y + 1)) {
            if ((y + 1 < ROWS) && color == board[x][y + 1])
                findNeighbours(array, x, y + 1);
            else {
                drawBorder(x * DIAMETER,
                           y * DIAMETER + DIAMETER,
                           x * DIAMETER + DIAMETER,
                           y * DIAMETER + DIAMETER);
            }
        }
        //left
        if (!included(array, x - 1, y)) {
            if ((x - 1 >= 0) && color == board[x - 1][y])
                findNeighbours(array, x - 1, y);
            else {
                drawBorder(x * DIAMETER,
                           y * DIAMETER,
                           x * DIAMETER,
                           y * DIAMETER + DIAMETER);
            }
        }
    }

    function drawBorder(startX, startY, endX, endY) {
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
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

        x = parseInt(x / (DIAMETER));
        y = parseInt(y / (DIAMETER));

        return { x: x, y: y };
    }
}