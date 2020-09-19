/*eslint-env browser*/

var canvas, context;
var isPaused = true;
var timer = 0;
var chartCount = 0;
var roomValues;
var squareSize = 50;
var personTable;
var rows;
var cols;
var usedPositions;
var startPersonsNumber;
var numberOfSurvivors = 0;
var areListenersEnabled = true;
var maxPersonsInside;
var stepTime;
var personsHaveSingleColor = false;
var doorPositions;
var inFrontOfDoorSpaces;
var doorsToUse;
var obstaclesDensity;
var panicFactor;
var numberOfSteps = 0;

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

    // // doors initialization - sadly hardcoded
    // doorPositions = [];
    // inFrontOfDoorSpaces = [];
    // doorPositions.push({row: Math.floor(rows / 2), col: Math.floor(cols - 1)});
    // inFrontOfDoorSpaces.push({row: doorPositions[0].row, col: doorPositions[0].col - 1});
    //
    // doorPositions.push({row: Math.floor(rows - 1), col: Math.floor(cols / 2)});
    // inFrontOfDoorSpaces.push({row: doorPositions[1].row - 1, col: doorPositions[1].col});
    //
    // doorPositions.push({row: Math.floor(0), col: Math.floor(cols / 2)});
    // inFrontOfDoorSpaces.push({row: doorPositions[2].row + 1, col: doorPositions[2].col});
    //
    // doorPositions.push({row: Math.floor(rows / 2), col: Math.floor(0)});
    // inFrontOfDoorSpaces.push({row: doorPositions[3].row, col: doorPositions[3].col + 1});

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
                roomValues[row][col] = -1;
            } else {
                roomValues[row][col] = 8;   // TODO later change to 0 (changes in movement logic needed)
            }
            // else {
            //     roomValues[row][col] = getDistanceToDoor(row, col);
            // }
        }
    }
}

// function getDistanceToDoor(row, col) {
//     let minDistance = 100000;
//     for (let i = 0; i < doorsToUse; i++) {
//         let doorRow = doorPositions[i].row;
//         let doorCol = doorPositions[i].col;
//         let distance = Math.sqrt(Math.pow(doorRow - row, 2) + Math.pow(doorCol - col, 2));
//         if (distance < minDistance) {
//             minDistance = distance;
//         }
//     }
//     return minDistance;
// }

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
    usedPositions = new Array(rows);
    for (let i = 0; i < rows; i++) {
        usedPositions[i] = new Array(cols);
    }
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            usedPositions[row][col] = 0;
        }
    }

    let freePositions = getFreePositions();
    maxPersonsInside = freePositions.length;
    document.getElementById('personsSlider').max = maxPersonsInside;
    let numberOfPersons = Math.min(startPersonsNumber, maxPersonsInside);

    for (let i = 0; i < numberOfPersons; i++) {
        let index = getRandomInt(freePositions.length);
        let pos = freePositions[index];
        freePositions.splice(index, 1);
        let person = {col: pos.col, row: pos.row, color: getRandomColor(), tries: 0};
        personTable.push(person);
        usedPositions[person.row][person.col] = 1;
    }
    updatePersons();
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

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function updatePersons() {
    updateHTMLPersonsNumbers();
    paintRoomSquares();
    for (let i = 0; i < personTable.length; i++) {
        let row = personTable[i].row;
        let col = personTable[i].col;
        if (personsHaveSingleColor) {
            context.fillStyle = "#3366DD";
        } else {
            context.fillStyle = personTable[i].color;
        }
        let xOffset = col * squareSize;
        let yOffset = row * squareSize;
        context.fillRect(xOffset, yOffset, squareSize, squareSize);
        context.strokeRect(xOffset, yOffset, squareSize, squareSize);
    }
}

function updateHTMLPersonsNumbers() {
    document.getElementById("peopleInside").innerHTML = personTable.length;
}

function initListeners() {
    startPersonsNumber = document.getElementById('personsSlider').value;
    document.getElementById('personsSlider').max = maxPersonsInside;
    stepTime = document.getElementById('stepTimeSlider').value;
    doorsToUse = document.getElementById('numberOfDoorsSlider').value; // TODO factors variables
    // obstaclesDensity = document.getElementById('obstaclesDensitySlider').value;
    // panicFactor = document.getElementById('panicFactorSlider').value;

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
    document.getElementById('SingleColorBox').addEventListener("click", function () {
        personsHaveSingleColor = document.getElementById('SingleColorBox').checked;
        updatePersons();
    });
}

function step() {
    checkEndOfSimulation();
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

// TODO refactor
function calculatePersonsNewPositions() {
    let newUsedPositions = new Array(rows);
    for (let i = 0; i < rows; i++) {
        newUsedPositions[i] = new Array(cols);
    }
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            newUsedPositions[row][col] = 0;
        }
    }
    let personsTempTable = [];
    for (let i = 0; i < personTable.length; i++) {
        let value = roomValues[personTable[i].row][personTable[i].col];
        personsTempTable[i] = {row: personTable[i].row, col: personTable[i].col, val: value, index: i};
    }

    let indexesToRemove = [];
    for (let i = personsTempTable.length - 1; i >= 0; i--) {
        let personIndex = personsTempTable[i].index;
        let actualValue = roomValues[personsTempTable[i].row][personsTempTable[i].col];
        let actualPosition = {row: personsTempTable[i].row, col: personsTempTable[i].col, val: actualValue};

        /** if standing in door - remove
         * else if standing too long or in panic - make random move
         * else try to make simple move (horizontal or vertical)
         */
        if (roomValues[personsTempTable[i].row][personsTempTable[i].col] === 0) {
            personsTempTable.splice(i, 1);
            indexesToRemove.push(personIndex);
            document.getElementById("peopleThatEscaped").innerHTML = '' + ++numberOfSurvivors;
        } else if (personTable[personIndex].tries > 3 || getRandomInt(100) < panicFactor) {
            let newPos = tryToFindRandomMove(actualPosition, newUsedPositions);
            personsTempTable.splice(i, 1);
            personTable[personIndex].row = newPos.row;
            personTable[personIndex].col = newPos.col;
            personTable[personIndex].tries = 0;
            newUsedPositions[newPos.row][newPos.col] = 1;
        } else {
            let newPos = tryToFindSimpleDirection(actualPosition, newUsedPositions);
            if (newPos.val < actualValue) {
                personsTempTable.splice(i, 1);
                personTable[personIndex].row = newPos.row;
                personTable[personIndex].col = newPos.col;
                newUsedPositions[newPos.row][newPos.col] = 1;
            }
        }
    }

    // if nothing from above worked try to make diagonal move, else dont move
    for (let i = personsTempTable.length - 1; i >= 0; i--) {
        let personIndex = personsTempTable[i].index;

        let actualValue = roomValues[personsTempTable[i].row][personsTempTable[i].col];
        let actualPosition = {row: personsTempTable[i].row, col: personsTempTable[i].col, val: actualValue};
        let newPos = tryToFindDiagonalDirection(actualPosition, newUsedPositions);
        if (newPos.val < actualValue) {
            personsTempTable.splice(i, 1);
            personTable[personIndex].row = newPos.row;
            personTable[personIndex].col = newPos.col;
        } else {    // if cant find new position increment person tries counter
            personTable[personIndex].tries++;
        }
        newUsedPositions[newPos.row][newPos.col] = 1;
    }

    for (let i = 0; i < indexesToRemove.length; i++) {
        personTable.splice(indexesToRemove[i], 1);
    }
    usedPositions = newUsedPositions;
}

function tryToFindSimpleDirection(actualPosition, newUsedPositions) {
    let newPositions = [];
    newPositions.push(checkPosition(actualPosition.row, actualPosition.col - 1, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row, actualPosition.col + 1, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row - 1, actualPosition.col, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row + 1, actualPosition.col, actualPosition.val, newUsedPositions));

    for (let i = 0; i < newPositions.length; i++) {
        if (newPositions[i] != null && newPositions[i].val < actualPosition.val) {
            actualPosition = newPositions[i];
        }
    }
    return actualPosition;
}

function tryToFindDiagonalDirection(actualPosition, newUsedPositions) {
    let newPositions = [];
    newPositions.push(checkPosition(actualPosition.row - 1, actualPosition.col - 1, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row - 1, actualPosition.col + 1, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row + 1, actualPosition.col - 1, actualPosition.val, newUsedPositions));
    newPositions.push(checkPosition(actualPosition.row + 1, actualPosition.col + 1, actualPosition.val, newUsedPositions));

    for (let i = 0; i < newPositions.length; i++) {
        if (newPositions[i] != null && newPositions[i].val < actualPosition.val) {
            actualPosition = newPositions[i];
        }
    }
    return actualPosition;
}

function tryToFindRandomMove(actualPosition, newUsedPositions) {
    let pRow = actualPosition.row;
    let pCol = actualPosition.col;

    let minRow = Math.max(pRow - 1, 0);
    let maxRow = Math.min(pRow + 1, rows - 1);

    let minCol = Math.max(pCol - 1, 0);
    let maxCol = Math.min(pCol + 1, cols - 1);

    let newPositions = [];
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            let posValue = roomValues[row][col];
            if ((row !== pRow && col !== pCol) && posValue >= 0 && usedPositions[row][col] !== 1 && newUsedPositions[row][col] !== 1) {
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

function checkPosition(row, col, actualValue, newUsedPositions) {
    let posValue = roomValues[row][col];
    if (posValue < actualValue && posValue >= 0 && usedPositions[row][col] !== 1 && newUsedPositions[row][col] !== 1) {
        return {row: row, col: col, val: posValue};
    } else {
        return null;
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
    doorsToUse = document.getElementById('alphaFactorSlider').value;
    document.getElementById('alphaFactorLabel').innerHTML = "Alpha factor (healthy -> infected): " + doorsToUse + " %";
}

function updateBetaFactor() {
    obstaclesDensity = document.getElementById('betaFactorSlider').value;
    document.getElementById('betaFactorLabel').innerHTML = "Beta factor (infected -> sick): " + obstaclesDensity + " %";
}

function updateGammaFactor() {
    panicFactor = document.getElementById('gammaFactorSlider').value;
    document.getElementById('gammaFactorLabel').innerHTML = "Gamma factor (sick -> recovered): " + panicFactor + " %";
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

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}