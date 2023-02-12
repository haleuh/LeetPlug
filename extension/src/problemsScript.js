console.log('Problems page intercepted');
window.addEventListener("load", onLoadPage, false);

// Configuration const
const darkThemeElement = "[data-theme='dark']"
const problemDescriptionTabElement = "[class='flex flex-row space-x-2 overflow-x-auto overflow-y-hidden']";  // Description tab header
const problemDescriptionElement = "[class='flex h-full w-full flex-1 flex-col']";  // Description content
const submissionResultElement = "div.flex.flex-col.gap-6.px-5.pt-6 > div > div.flex.items-center.gap-4 > div > span";  // Result element
const codeAreaElement = "[class='h-full flex-col ssg__qd-splitter-secondary-w']";   // Code area
const codingPanelElement = "[class='relative flex h-full flex-col']"; // Code content
const bottomButtonElement = "[class='ml-auto flex items-center space-x-4']";  // Run button
const submitCodeButton = ":button:contains('Submit')";  // Submit button
const resetCodeButton = "div.overflow-hidden.ml-2.my-2 > div > div:nth-child(3) > button";
const resetCodeButtonWarn = ":button:contains('Confirm')";
const questionTitleElement = "[class='mt-3 flex space-x-4']";  // Question title
const difficultyEasyElement = "[class*='bg-olive']";  // Difficulty
const difficultyMediumElement = "[class*='bg-yellow']";
const difficultyHardElement = "[class*='bg-pink']";

const easyId = 1;
const mediumId = 10;
const hardId = 100;


const customControlButtons = `
<div id='controlButtons'>
<p id="controlButtonsTitle" class="title_style">LeetPlug mask</p>
<p id="controlButtonsText" class="text_style">Choose how to start the problem:</p>
<p id="showProblemWithStopwatchAndTrack" class="round_style">Show the problem with visible stopwatch and remote tracking</p>
<p id="showProblemNoStopwatchButTrack" class="round_style">Show the problem with hidden stopwatch and remote tracking</p>
<p id="showProblemNoStopwatchNoTrack" class="round_style">Show the problem without any tracking</p>
</div>
`

// Styles definition
var lightTimerStyle = `
.timer_style {
    border-radius: 2px;
    border:1px solid #E8E8E8;
    background-color: #FAFAFA;
    color: black;
    font-weight: bold;
    padding: 5px;
    margin-right: 10px;
}
.title_style {
    margin: 10;
    text-align: center;
    font-color: #FAFAFA;
    font-weight: bold;
    font-size: 150%;
}
.text_style {
    margin: 10;
    text-align: center;
    font-color: #616161;
}
.round_style {
    margin: 10;
    text-align: center;
    font-weight: bold;
    border-radius: 2px;
    border:1px solid #E8E8E8;
    background: #FAFAFA;
    padding: 20px; 
    width: 100%;
    height: auto;
}
.round_style:hover {
    background: #FFFFFF;
}

#controlButtons {
    margin: auto;
}
`

var darkTimerStyle = `
.timer_style {
    border-radius: 2px;
    border:1px solid #bfbfbf;
    background-color: #282828;
    color: black;
    font-weight: bold;
    padding: 5px;
    margin-right: 10px;
}
.title_style {
    margin: 10;
    text-align: center;
    font-color: #FAFAFA;
    font-weight: bold;
    font-size: 150%;
}
.text_style {
    margin: 10;
    text-align: center;
    font-color: #bfbfbf;
}
.round_style {
    margin: 10;
    text-align: center;
    font-weight: bold;
    border-radius: 2px;
    border:1px solid #E8E8E8;
    background: #282828;
    padding: 20px; 
    width: 100%;
    height: auto;
}
.round_style:hover {
    background: #1a1a1a;
}

#controlButtons {
    margin: auto;
}
`

// Globals
var sec = 0;
var userId = "";
var userKey = "";
var currentProblem = "";
var problemDifficulty = 'Unknown';
var session = 0;
var webAppURL = "";
var webAppBasic = "";
var jsSubmissionChecktimer;

// Get information from background page (warning, this is totally async!)
chrome.runtime.sendMessage({method: "getWebAppURL"}, function(response) {
    webAppURL = response.data;
    //console.log(webAppURL)
});
chrome.runtime.sendMessage({method: "getWebAppBasic"}, function(response) {
    webAppBasic = response.data;
    //console.log(webAppBasic)
});
chrome.runtime.sendMessage({method: "geUserId"}, function(response) {
    userId = response.data;
    //console.log(userId)
});
chrome.runtime.sendMessage({method: "getUserKey"}, function(response) {
    userKey = response.data;
    //console.log(userKey)
});

// JQuery helper to check for an attribute existence
$.fn.hasAttribute = function(name) {
    return this.attr(name) !== undefined;
}

// Timer functions
var startTime;
var updatedTime;
var difference;
var tInterval;
var savedTime;
var running = 0;

function pad ( val ) {
    return val > 9 ? val : "0" + val;
}

function startTimer(){
    if(!running){
      startTime = new Date().getTime();
      tInterval = setInterval(getShowTime, 1000);
      paused = 0;
      running = 1;
    }
}

function stopTimer(){
    clearInterval(tInterval);
    savedTime = 0;
    difference = 0;
    paused = 0;
    running = 0;
}

function pauseTimer(){
    if (difference && !paused) {
        clearInterval(tInterval);
        savedTime = difference;
        paused = 1;
        running = 0;
    } else {
        startTimer();
    }
}

function resetTimer(){
    clearInterval(tInterval);
    savedTime = 0;
    difference = 0;
    paused = 0;
    running = 0;
    showTime();
}

// Thanks to https://medium.com/@olinations/stopwatch-script-that-keeps-accurate-time-a9b78f750b33
// for the nice timer :D
function getTime() {
    updatedTime = new Date().getTime();
    if (savedTime){
        difference = (updatedTime - startTime) + savedTime;
    } else {
        difference =  updatedTime - startTime;
    }
}

function showTime() {
    var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((difference % (1000 * 60)) / 1000);

    $("#timer").html(pad(hours) + " Hours " + pad(minutes) + " Minutes " + pad(seconds) + " Seconds");
}

function getShowTime() {
    getTime();
    showTime();
}

// Show the timer
function showTimer() {
    $("#timer").attr("style", "display: visible;");
    timerVisible = true;
}

// Hide the timer
function hideTimer() {
    $("#timer").attr("style", "display: none;");
    timerVisible = false;
}

// Hide the original elements and just show the buttons
function enableMask() {
    $("#controlButtonsTitle").attr("style", "display: visible;");
    $("#controlButtonsText").attr("style", "display: visible;");
    $("#showProblemWithStopwatchAndTrack").attr("style", "display: visible;");
    $("#showProblemNoStopwatchButTrack").attr("style", "display: visible;");
    $("#showProblemNoStopwatchNoTrack").attr("style", "display: visible;");
    $(problemDescriptionElement).attr("style", "display: none;");
    $(codeAreaElement).children(codingPanelElement).attr("style", "visibility: hidden;");

    maskEnabled = true;
}

// Show original hidden elements
function disableMask() {
    $("#controlButtonsTitle").attr("style", "display: none;");
    $("#controlButtonsText").attr("style", "display: none;");
    $("#showProblemWithStopwatchAndTrack").attr("style", "display: none;");
    $("#showProblemNoStopwatchButTrack").attr("style", "display: none;");
    $("#showProblemNoStopwatchNoTrack").attr("style", "display: none;");
    $(problemDescriptionElement).attr("style", "display: visible;");
    $(codeAreaElement).children(codingPanelElement).attr("style", "visibility: visible;");

    maskEnabled = false;
}

// Send the event related to the problem (start, submit) to the remote web service
function sendProblemEvent(problem, event, session) {
    console.log('Info: ' + userId + " " + userKey);
    if (userId === "" || userKey === "") return;

    const req = new XMLHttpRequest();
    let url = new URL(webAppURL + '/events');
    var formData = new FormData();
    formData.append('id', userId);
    formData.append('key', userKey);
    formData.append('clientVersion', chrome.runtime.getManifest().version);
    formData.append('problem', problem);
    formData.append('difficulty', problemDifficulty);
    formData.append('event', event);
    formData.append('session', session);
    console.log('Sending message to: ' + url);

    req.open("POST", url, true)
    req.setRequestHeader('Authorization', webAppBasic);
    req.send(formData);
}

// Get the problem identifier from token of the URL
function getProblem(pageURL) {
    var tokens = pageURL.split("/");

    if (tokens.length >= 2)
        return tokens[tokens.length - 2];

    return "NA";
}

// Get the problem difficulty
function getProblemDifficulty() {
    if ($(questionTitleElement).children(difficultyEasyElement).length)
        return easyId;
    if ($(questionTitleElement).children(difficultyMediumElement).length)
        return mediumId;
    if ($(questionTitleElement).children(difficultyHardElement).length)
        return hardId;
}

// This function can identify if the submission was completed and stop the polling cycle
function checkForSubmitComplete () {
    if ($(submissionResultElement).length) {
        if ($(submissionResultElement).text() === "Accepted") {
            clearInterval(jsSubmissionChecktimer);
            console.log("SUCCESS");
            stopTimer();
            sendProblemEvent(currentProblem, "result_ok", session);
        } else {
            clearInterval(jsSubmissionChecktimer);
            console.log("ERROR");
            sendProblemEvent(currentProblem, "result_ko", session);
        }
    }
}

var descriptionTrigger = true;
var codeAreaTrigger = true;
var maskEnabled = true;
var timerVisible = true;
var currenDescriptionLink = "";

function prepareSession() {
    session = Date.now();
    currentProblem = getProblem(currenDescriptionLink);
    console.log("PROBLEM: " + currentProblem);
    disableMask();
    problemDifficulty = getProblemDifficulty();
}

function checkForMutations () {
    if (currenDescriptionLink !== "" &&
        $(problemDescriptionTabElement).find('a').attr('href') !== currenDescriptionLink) {
        currenDescriptionLink = $(problemDescriptionTabElement).find('a').attr('href');
        console.log("NEW PROBLEM: " + currenDescriptionLink);
        clearInterval(jsSubmissionChecktimer);
        resetTimer();
        showTimer();
        enableMask();
    }

    if (!$(problemDescriptionElement).length) {
        descriptionTrigger = true;
    } else if ($(problemDescriptionElement).length && descriptionTrigger) {
        descriptionTrigger = false;
        console.log("DESC CREATED!");

        if (maskEnabled) {
            $(problemDescriptionElement).attr("style", "display: none;");

            if (!$('#controlButtons').length) {
                // store the current Description URL, that will later use to understand if the
                // content is changed
                currenDescriptionLink = $(problemDescriptionTabElement).find('a').attr('href');

                $(customControlButtons).insertBefore($(problemDescriptionElement));

                // set the callbacks on click on button
                $("#showProblemWithStopwatchAndTrack").click(function() {
                    // if the coding panel is not clean
                    if ($(resetCodeButtonWarn).length) {
                        // trigger the reset of the code
                        $(resetCodeButtonWarn).click();
                        prepareSession();
                        startTimer();
                        sendProblemEvent(currentProblem, "start", session);
                    } else {
                        // trigger the reset of the code
                        $(resetCodeButton).click();
                    }
                });
                $("#showProblemNoStopwatchButTrack").click(function() {
                    // if the coding panel is not clean
                    if ($(resetCodeButtonWarn).length) {
                        // trigger the reset of the code
                        $(resetCodeButtonWarn).click();
                        prepareSession();
                        hideTimer();
                        sendProblemEvent(currentProblem, "start", session);
                    } else {
                        // trigger the reset of the code
                        $(resetCodeButton).click();
                    }
                });
                $("#showProblemNoStopwatchNoTrack").click(function() {
                    prepareSession();
                    hideTimer();
                    sendProblemEvent(currentProblem, "start_no_track", session);
                });
            }
        }
    }

    if (!$(codeAreaElement).length &&
        !$(codeAreaElement).children(codingPanelElement).length) {
        codeAreaTrigger = true;
        clearInterval(jsSubmissionChecktimer);
    } else if ($(codeAreaElement).length &&
                $(codeAreaElement).children(codingPanelElement).length &&
                codeAreaTrigger) {
        codeAreaTrigger = false;
        console.log("CODE CREATED!");

        if (maskEnabled) {
            // hide the coding panel
            // use "visibility" to keep the space in the layout
            $(codeAreaElement).children(codingPanelElement).attr("style", "visibility: hidden;");
        }

        // add the timer near the submission buttons
        $('<label id="timer" class="timer_style" style="display: none;">00 Hours 00 Minutes 00 Seconds</label>').prependTo($(bottomButtonElement));
        if (timerVisible)
            showTimer();

        $(submitCodeButton).click(function() {
            console.log("SUBMIT");
            clearInterval(jsSubmissionChecktimer);
            jsSubmissionChecktimer = setInterval(checkForSubmitComplete, 500);
        });
    }
}

// Theme function
function getThemeStyle() {
    if ($(darkThemeElement).length)
        return darkTimerStyle;
    return lightTimerStyle;
}

// Main onLoadPage function, starts the cycles needed to discover the elements inside the page
// and to attach listeners to them
function onLoadPage (evt) {
    // insert the styles for the custom components
    var styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = getThemeStyle();
    document.head.appendChild(styleSheet);
    setInterval(checkForMutations, 500);
}
