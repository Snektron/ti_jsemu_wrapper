/*
    This file is part of 'ti_jsemu_wrapper' - see https://github.com/TI-Planet/ti_jsemu_wrapper
    LGPL3-licensed
*/

var destCanvasCtx;
var srcCanvas;
var histoList;
var calculatorDiv;
var hand;
var displayDiv;
var zoomDiv;
var svgDisplay;
var calcZoom = 1.0;
var histoListMaxEls = 8;
var hasHand = false;
var hasZoomedDisplay = true;
var keyHistoryArray = [];
var isFF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

$id = function(id) { return document.getElementById(id); };
$sel = function(sel) { return document.querySelector(sel); };
$selAll = function(sel) { return document.querySelectorAll(sel); };

function initWithSVG(svgStr) {
    init_wrapper();
    svgVar = svgStr;
    clog_bak = console.log;
    theCalc = new TI84ForSmartView();
    console.log = clog_bak;
    if (!theCalc) {
        return alert("Error initializing the emulator :(")
    }
    theCalc.initSVG();
    svgDisplay = $id("Display_Rect");
    resizeHelper();
    $id("svg").style.background = $sel("#Background_Color rect").getAttribute("fill") || "#000";
    theCalc.boot();
    refreshCanvas();
    bindEvents();
    $id("leftToolbar").style.visibility = $id("rightToolbar").style.visibility = "visible";
}

function init_wrapper() {
    displayDiv = $id("displayDiv");
    zoomDiv = $id("zoom");
    destCanvasCtx = $id("zoomeddisplay").getContext('2d');
    srcCanvas = $id("display");
    destCanvasCtx.scale(1.5, 1.5);
    histoList = $id("list");
    calculatorDiv = $id("calculatorDiv");
    hand = $id("hand");
    var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    $id('start').disabled = !isChrome;
    $id('start').title = isChrome ? 'Will create a webm video' : 'Feature only available on Chrome (needs WebP)!';
}

function bindEvents() {
    [].forEach.call($selAll("#svg g[id^='KEY']"), function(key) {
        key.addEventListener("click", function () {
            var emu_hist = theCalc.getKeyHistory();
            if (emu_hist.length && keyHistoryArray != emu_hist) {
                keyHistoryArray = emu_hist.slice();
                addKeyToHistory(keyHistoryArray[keyHistoryArray.length - 1]);
            }
        }, false);
    });

    document.addEventListener('keydown', function(e) {
        if (e.keyCode == 27) { // escape key
            if ($sel("#svg g[id^='KEY'] path[fill='red']")) {
                theCalc.clearHighlightedKey();
            } else {
                clearHisto();
            }
        }
    });

    zoomDiv.onmouseenter = calculatorDiv.onmouseenter = function() { hasHand && (hand.style.visibility = "visible"); };
    zoomDiv.onmouseleave = calculatorDiv.onmouseleave = function() { hasHand && (hand.style.visibility = "hidden"); };
    zoomDiv.onmousemove = calculatorDiv.onmousemove = function(e) { hasHand && moveHand((e || event).clientX, (e || event).clientY); };

    $id("resetEmu").onclick = function() { theCalc.resetSVEmulator(); clearHisto(); };
    $id("clearKey").onclick = function() { theCalc.clearHighlightedKey(); };
    $id("screenshot").onclick = function() { downloadScreenshot('display', 'screenshot_calc.png'); };
    $id("toggleHisto").onclick = function() { clearHisto(); toggleDisplay('histo'); };
    $id("toggleZoom").onclick = function() { toggleDisplay('zoom'); hasZoomedDisplay = !hasZoomedDisplay; };
    $id("toggleHand").onclick = function() {
        hasHand = !hasHand;
        [].forEach.call($selAll('#display, #calcTop, #zoom, #svg'), function(el) {
            el.style.cursor = hasHand ? "none" : "default";
        });
    };

    window.onresize = resizeHelper;
}

function refreshCanvas() {
    if (hasZoomedDisplay) {
        destCanvasCtx.drawImage(srcCanvas, 0, 0);
    }
    setTimeout(refreshCanvas, 100);
}

function downloadScreenshot(canvas, filename) {
    var lnk = document.createElement('a');
    lnk.download = filename;
    lnk.target = "_blank"; // at least it doesn't replace the current page in Safari...
    lnk.href = $id(canvas).toDataURL();
    if (document.createEvent) {
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        lnk.dispatchEvent(e);
    } else if (lnk.fireEvent) {
        lnk.fireEvent("onclick");
    }
}

function moveHand(x, y) {
    x /= calcZoom;
    y /= calcZoom;
    if (calculatorDiv) {
        var rect = calculatorDiv.getBoundingClientRect();
        x = x - rect.left;
        y = y - rect.top;
    }
    x = x - 20;
    y = y - 5;
    if (hand) {
        hand.style.left = x + "px";
        hand.style.top = y + "px";
    }
}

function clearHisto() {
    keyHistoryArray = [];
    histoList.innerHTML = "";
}

function addKeyToHistory(name) {
    var li = document.createElement("li");
    var oImg = document.createElement("img");
    oImg.setAttribute('src', buttonImages[name] );
    oImg.style.width = oImg.style.height = "72px";
    li.appendChild(oImg);
    if (histoList.childNodes.length) {
        histoList.insertBefore(li, histoList.firstChild);
    } else {
        histoList.appendChild(li);
    }
    if (histoList.childNodes.length > histoListMaxEls) {
        histoList.removeChild(histoList.lastChild);
    }
}

function toggleDisplay(id) {
    var e = $id(id);
    e.style.display = e.style.display != 'none' ? 'none' : 'block';
}

function resizeHelper() {
    theCalc.Zoom();
    var val = isFF ? parseFloat(calculatorDiv.style.transform.replace("scale(","").replace(")","")) : calculatorDiv.style.zoom;
    val *= 0.8;
    if (val < 1)
        val = 1;
    calculatorDiv.style.zoom = val;
    calculatorDiv.style.MozTransform = "scale(" + val + ")";
    calcZoom = val;
}