/*eslint-env browser*/

let canvas, context;
let isPaused = true;
let timer = 0;
let chartCount = 0;
let roomValues;
let squareSize = 50;
let personTable;
let rows;
let cols;
let usedPositions;
let startPersonsNumber;
let numberOfSurvivors = 0;
let areListenersEnabled = true;
let maxPersonsInside;
let stepTime;
let doorPositions;
let inFrontOfDoorSpaces;
let alphaFactor;
let betaFactor;
let gammaFactor;
let numberOfSteps = 0;

window.onload = function () {
    canvas = document.getElementById("board");
    context = canvas.getContext("2d");
    initChart();
    initListeners();
    initRoom();
    initPersons();
};

function initRoom() {
    initRoomValues();
    paintRoomSquares();
}

function initRoomValues() {
    rows = document.getElementById("board").height / squareSize;
    cols = document.getElementById("board").width / squareSize;
    roomValues = new Array(rows);

    for (let i = 0; i < rows; i++) {
        roomValues[i] = new Array(cols);
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
                roomValues[row][col] = -1;
            } else {
                roomValues[row][col] = 0;
            }
        }
    }
}

function paintRoomSquares() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let rectValue = roomValues[row][col];
            context.fillStyle = getRectColor(rectValue);
            let xOffset = col * squareSize;
            let yOffset = row * squareSize;
            context.fillRect(xOffset, yOffset, squareSize, squareSize);
            context.strokeRect(xOffset, yOffset, squareSize, squareSize);
        }
    }
}

function getRectColor(rectValue) {
    if (rectValue === -1) {
        return "#231f20";
    } else {
        return "#ffffff";
    }
}

function initPersons() {
    personTable = [];
    usedPositions = getNewEmptyInsideBoardValues(rows, cols)

    let freePositions = getFreePositions();
    maxPersonsInside = freePositions.length;
    document.getElementById('personsSlider').max = maxPersonsInside;
    let numberOfPersons = Math.min(startPersonsNumber, maxPersonsInside);

    for (let i = 0; i < numberOfPersons; i++) {
        let index = getRandomInt(freePositions.length);
        let pos = freePositions[index];
        freePositions.splice(index, 1);
        let person = {col: pos.col, row: pos.row, state: 0, stateSteps: 0}
        personTable.push(person);
        usedPositions[person.row][person.col] = {isUsed: true, state: 0}
    }
    initInfectedPersons();
    updatePersons();
}

function getNewEmptyInsideBoardValues(rows, cols) {
    let boardValues = new Array(rows);
    for (let i = 0; i < rows; i++) {
        boardValues[i] = new Array(cols);
    }
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            boardValues[row][col] = {isUsed: false, state: 0};
        }
    }
    return boardValues
}

function getFreePositions() {
    let freePositions = [];
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            if (roomValues[row][col] !== -2) {
                freePositions.push({row: row, col: col});
            }
        }
    }
    return freePositions;
}

function initInfectedPersons() {
    let count = 1; // TODO value taken from global variable from slider "countOfInfected"
    for (let i = 0; i < personTable.length; i++) {
        if (count === 0) {
            return
        }
        count--
        let person = personTable[i]
        person.state = 1
        usedPositions[person.row][person.col] = {isUsed: true, state: 1}
    }
}

function updatePersons() {
    updateHTMLPersonsNumbers();
    paintRoomSquares();
    for (let i = 0; i < personTable.length; i++) {
        let row = personTable[i].row;
        let col = personTable[i].col;
        let state = personTable[i].state
        let xOffset = col * squareSize;
        let yOffset = row * squareSize;

        context.fillStyle = getColorForPerson(state)
        context.fillRect(xOffset, yOffset, squareSize, squareSize);
        context.strokeRect(xOffset, yOffset, squareSize, squareSize);
    }
}

function updateHTMLPersonsNumbers() {
    document.getElementById("peopleInside").innerHTML = personTable.length;
}

function getColorForPerson(state) {
    if (state === 0)
        return "#54a220"
    else if (state === 1)
        return "#ffed43"
    else if (state === 2)
        return "#d73417"
    else if (state === 3)
        return "#3366DD"
}

function initListeners() {
    startPersonsNumber = document.getElementById('personsSlider').value;
    document.getElementById('personsSlider').max = maxPersonsInside;
    stepTime = document.getElementById('stepTimeSlider').value;
    alphaFactor = document.getElementById('alphaFactorSlider').value;
    betaFactor = document.getElementById('betaFactorSlider').value;
    gammaFactor = document.getElementById('gammaFactorSlider').value;

    initSlidersLabels();

    document.getElementById('personsSlider').addEventListener("input", function () {
        updateStartPersonsNumber();
    });
    document.getElementById('squareSizeSlider').addEventListener("input", function () {
        updateSquareSize();
    });
    document.getElementById('stepTimeSlider').addEventListener("input", function () {
        updateStepTime();
    });
    document.getElementById('alphaFactorSlider').addEventListener("input", function () {
        updateAlphaFactor();
    });
    document.getElementById('betaFactorSlider').addEventListener("input", function () {
        updateBetaFactor();
    });
    document.getElementById('gammaFactorSlider').addEventListener("input", function () {
        updateGammaFactor();
    });
}

function step() {
    checkEndOfSimulation();
    calculatePersonsStates();
    calculatePersonsNewPositions();
    updatePersons();
    updateChart();

    document.getElementById("numberOfSteps").innerHTML = '' + ++numberOfSteps;
    if (!isPaused) {
        timer = setTimeout(step, stepTime);
    }
}

// TODO another end of simulation - everyone is recovered
function checkEndOfSimulation() {
    if (personTable.length === 0) {
        pause();
    }
}

/** states:
 * 0 - healthy
 * 1 - infected
 * 2 - sick
 * 3 - recovered
 */
function calculatePersonsStates() {
    // najpierw switch / ify do rozeznania stanu
    // 0 - zabawa w badanie sasiadow czy sa zainfekowani / chorzy
    // 1 - dodawanie stateStepsow i uzywanie pBeta
    // 2 - dodawanie stateStepsow i uzywanie pGamma
    // 3 - return

    calcStateForHealthy()
    for (let i = 0; i < personTable.length; i++) {
        let state = personTable[i].state
        if (state === 1)
            calcStateForInfected(i)
        else if (state === 2)
            calcStateForSick(i)
    }
}

function calcStateForHealthy() {
    let newPersonTable = []
    newPersonTable.push(...personTable)
    let newUsedPositions = copyUsedPositions()

    for (let i = 0; i < personTable.length; i++) {
        let state = personTable[i].state
        if (state !== 0)
            continue

        let pRow = personTable[i].row;
        let pCol = personTable[i].col;
        let minRow = Math.max(pRow - 1, 1);
        let maxRow = Math.min(pRow + 1, rows - 2);
        let minCol = Math.max(pCol - 1, 1);
        let maxCol = Math.min(pCol + 1, cols - 2);
        let riskCounter = 0

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (usedPositions[row][col].state === 1 || usedPositions[row][col].state === 2) {
                    riskCounter++
                }
            }
        }
        // TODO jakies bardziej fancy przeliczanie prawd. zarazenia
        let infectionProb = riskCounter * alphaFactor;
        if (getRandomBooleanForPercent(infectionProb)) {
            newPersonTable[i] = {col: personTable[i].col, row: personTable[i].row, state: 1, stateSteps: 0}
            newUsedPositions[pRow][pCol] = {isUsed: newUsedPositions[pRow][pCol].isUsed, state: 1}
        }
    }
    personTable = newPersonTable
    usedPositions = newUsedPositions
}

function copyUsedPositions() {
    let newUsedPositions = new Array(rows);
    for (let i = 0; i < rows; i++) {
        newUsedPositions[i] = Array(cols);
    }
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            newUsedPositions[row][col] = {...usedPositions[row][col]};
        }
    }
    return newUsedPositions
}

function calcStateForInfected(i) {

}

function calcStateForSick(i) {

}

function calculatePersonsNewPositions() {
    let newUsedPositions = getNewEmptyInsideBoardValues(rows, cols)
    for (let i = personTable.length - 1; i >= 0; i--) {
        let actualPosition = {row: personTable[i].row, col: personTable[i].col};

        let newPos = tryToFindRandomMove(actualPosition, newUsedPositions);
        personTable[i].row = newPos.row;
        personTable[i].col = newPos.col;
        newUsedPositions[newPos.row][newPos.col] = {isUsed: true, state: personTable[i].state}
    }
    usedPositions = newUsedPositions
}

function tryToFindRandomMove(actualPosition, newUsedPositions) {
    let pRow = actualPosition.row;
    let pCol = actualPosition.col;
    let minRow = Math.max(pRow - 1, 1);
    let maxRow = Math.min(pRow + 1, rows - 2);
    let minCol = Math.max(pCol - 1, 1);
    let maxCol = Math.min(pCol + 1, cols - 2);
    let newPositions = [];

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if ((row !== pRow && col !== pCol) && !usedPositions[row][col].isUsed && !newUsedPositions[row][col].isUsed) {
                newPositions.push({row: row, col: col});
            }
        }
    }
    if (newPositions.length > 0) {
        return newPositions[getRandomInt(newPositions.length)];
    } else {
        return actualPosition;
    }
}

// ### start button ###
function start() {
    if (isPaused) {
        timer = setTimeout(step, stepTime);
        isPaused = false;
        areListenersEnabled = false;
    }
}

// pause button
function pause() {
    if (!isPaused) {
        clearTimeout(timer);
        isPaused = true;
        areListenersEnabled = true;
    }
}

function initSlidersLabels() {
    document.getElementById('startNumberOfPeopleLabel').innerHTML = "Start number of people: " + document.getElementById('personsSlider').value;
    document.getElementById('squareSizeLabel').innerHTML = "Square size: " + document.getElementById('squareSizeSlider').value;
    document.getElementById('stepTimeLabel').innerHTML = "Step time: " + document.getElementById('stepTimeSlider').value;
    document.getElementById('alphaFactorLabel').innerHTML = document.getElementById('alphaFactorLabel').innerHTML + document.getElementById('alphaFactorSlider').value + " %";
    document.getElementById('betaFactorLabel').innerHTML = document.getElementById('betaFactorLabel').innerHTML + document.getElementById('betaFactorSlider').value + " %";
    document.getElementById('gammaFactorLabel').innerHTML = document.getElementById('gammaFactorLabel').innerHTML + document.getElementById('gammaFactorSlider').value + " %";
}

function updateStartPersonsNumber() {
    if (areListenersEnabled) {
        startPersonsNumber = document.getElementById('personsSlider').value;
        document.getElementById('startNumberOfPeopleLabel').innerHTML = "Start number of people: " + startPersonsNumber;
        updateViewedNumbers();
        initPersons();
    }
}

function updateSquareSize() {
    if (areListenersEnabled) {
        let newSquareSize = document.getElementById('squareSizeSlider').value;
        if (document.getElementById('board').height % newSquareSize === 0) {
            squareSize = newSquareSize;
            document.getElementById('squareSizeLabel').innerHTML = "Square size: " + squareSize;
            updateViewedNumbers();
            initRoom();
            initPersons();
        }
    }
}

function updateStepTime() {
    stepTime = document.getElementById('stepTimeSlider').value;
    document.getElementById('stepTimeLabel').innerHTML = "Step time: " + stepTime;
}

function updateAlphaFactor() {
    alphaFactor = document.getElementById('alphaFactorSlider').value;
    document.getElementById('alphaFactorLabel').innerHTML = "Alpha factor (healthy -> infected): " + alphaFactor + " %";
}

function updateBetaFactor() {
    betaFactor = document.getElementById('betaFactorSlider').value;
    document.getElementById('betaFactorLabel').innerHTML = "Beta factor (infected -> sick): " + betaFactor + " %";
}

function updateGammaFactor() {
    gammaFactor = document.getElementById('gammaFactorSlider').value;
    document.getElementById('gammaFactorLabel').innerHTML = "Gamma factor (sick -> recovered): " + gammaFactor + " %";
}

function updateViewedNumbers() {
    numberOfSurvivors = 0;
    document.getElementById("peopleThatEscaped").innerHTML = '' + numberOfSurvivors;
    numberOfSteps = 0;
    document.getElementById("numberOfSteps").innerHTML = '' + numberOfSteps;
}

function initChart() {
    let traceIn = {
        y: [0],
        mode: 'lines',
        name: 'In',
        line: {
            color: 'rgb(255, 31, 34)',
            width: 5
        }
    };

    let traceOut = {
        y: [0],
        mode: 'lines',
        name: 'Outside',
        line: {
            color: 'rgb(2, 230, 48)',
            width: 5
        }
    };

    let data = [traceIn, traceOut];
    let layout = {
        title: 'People in and out'
    };
    Plotly.newPlot('chart', data, layout);
}

function updateChart() {
    Plotly.extendTraces('chart', {y: [[personTable.length]]}, [0]);
    Plotly.extendTraces('chart', {y: [[numberOfSurvivors]]}, [1]);
    chartCount++;
    if (chartCount > 50) {
        Plotly.relayout('chart', {
            xaxis: {
                range: [chartCount - 50, chartCount]
            }
        });
    }
}

function getRandomBooleanForPercent(percent) {
    return getRandomInt(100) < percent;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}