
var gazeTime = 1500 // time staring at something until action is confirmed
var userSelectionDelay = 2500 // delay for user to focus before gazeTime starts
var activationInterval = 100 // delay between target guesses
var cursorSize = 90
var sampleSize = gazeTime / activationInterval // number of consecutive elements that should match
var cursorPosition = { x: -1000, y: -1000 }
var potentialTargets = []
var actionActivationTimer = []
var sampleIntervalTimers = []
var actionButtonActivated = false
var userZoomLevel = 1
var newZoomLevel = userZoomLevel
var zoomDelta = 0.0001 * activationInterval
var animateZoom = true
var content = $('body')[0]
var container = $('html')[0]
var clientWidth = 0
var clientHeight = 0
var contentWidth = content.clientWidth
var contentHeight = content.clientHeight

////////////////////////////////////

var render = function(left, top, zoom) {
  content.style.marginLeft = left ? (-left/zoom) + 'px' : '';
  content.style.marginTop = top ? (-top/zoom) + 'px' : '';
  content.style.zoom = zoom || '';
};

var scroller = new Scroller(render, {
  zooming: true,
  animating: true,
  animationDuration: 2 * 300,
  maxZoom: 5
});

var rect = content.getBoundingClientRect();
scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop);

// Reflow handling
var reflow = function() {
  clientWidth = container.clientWidth;
  clientHeight = container.clientHeight;
  scroller.setDimensions(clientWidth, clientHeight, contentWidth, contentHeight);
};

window.addEventListener("resize", reflow, false);
reflow();

//////////////////////////////////


var controls =  '<div id="eye-tracking-controls" style="position: fixed; display: none;">' +
                  '<div class="browser-controls" >' +
                    '<button disabled="true" class="back-button" >BACK</button>' +
                    '<button disabled="true" class="forward-button" >FORWARD</button>' +
                    '<button disabled="true" class="refresh-button" >REFRESH</button>' +
                    '<button disabled="true" class="home-button" >HOME</button>' +
                    '<button disabled="true" class="settings-button" >SETTINGS</button>' +
                  '</div>' +
                  '<div class="action-controls" >' +
                    '<button class="action-button" >ACTION</button>' +
                    '<button disabled="true" class="scroll-button" >SCROLL</button>' +
                    '<button disabled="true" class="up-button" >UP   </button>' +
                    '<button disabled="true" class="down-button" >DOWN </button>' +
                    '<button disabled="true" class="left-button" >LEFT </button>' +
                    '<button disabled="true" class="right-button" >RIGHT</button>' +
                    '<button disabled="true" class="cancel-scroll-button" style="display: none;">CANCEL SCROLL</button>' +
                  '</div>' +
                '</div>'

var overlay = '<div id="eye-tracking-mask" style="position: fixed; top: 0; left: 0; display: block;"></div>'
$('body').append(overlay)

$('html').append(controls)
positionControls();

$(window).resize(function(e){
  positionControls();
});

$('#eye-tracking-controls .action-button').on({
  mouseenter: function (e) {
    if (!actionButtonActivated) {
      var self = this
      var actionActivationTimer = setTimeout(function () {
        actionButtonActivated = true
        $(self).addClass('active')
        spotlightCursorOn()
        setTimeout(function () {
          prepareKeyboard()
          startSamplingTargets()
          sampleIntervalTimers.push(setInterval(sampleElements, activationInterval))
        }, userSelectionDelay)
        clearTimeout(actionActivationTimer)
      }, gazeTime)
    }
  },
  mouseleave: function (e) {
    clearTimeout(actionActivationTimer)
  }
});

function pickTarget (e, cursorX, cursorY) {
  potentialTargets.slice(-(sampleSize))
  potentialTargets.push(this)
  if (potentialTargets.length > sampleSize) {
    var recentTargetSamples = potentialTargets.slice(-sampleSize)
    var recentlySampledTargets = $.unique(recentTargetSamples)
    if (recentlySampledTargets.length == 1) {
      var targetElement = recentlySampledTargets[0]
      triggerSelectionOf(targetElement, cursorPosition.x, cursorPosition.y)
    } else {
      newZoomLevel = newZoomLevel + zoomDelta
      if (newZoomLevel > scroller.options.maxZoom) {
        cancelSelection()
      } else {
        scroller.zoomTo(newZoomLevel, animateZoom, cursorPosition.x, cursorPosition.y);
        spotlightCursorMove({
          clientX: cursorPosition.x,
          clientY: cursorPosition.y
        })
      }
    }
  }
  e.stopPropagation()
}

function positionControls () {
  var controlsHeight = $('#eye-tracking-controls').height();
  var offset = parseInt(window.innerHeight) - parseInt(controlsHeight);
  $('#eye-tracking-controls').css('top',offset);
  $('body').css('margin-bottom', 1.5 * controlsHeight);
  $('#eye-tracking-controls').css('display','block'); // show it once it's positioned
}

function prepareKeyboard () {
  $('text, textarea, input:not(:file):not(:radio):not(:submit):not(:hidden):not(:button):not(:checkbox):not(:image)').keyboard({
    // set this to ISO 639-1 language code to override language set by the layout
    // http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    // language defaults to "en" if not found
    language: ['en'], // string or array

    // *** choose layout ***
    layout: 'qwerty',
    customLayout: { 'normal': ['{cancel}'] },

    position : {
      of : $('body'), // null (attach to input/textarea) or a jQuery object (attach elsewhere)
      my : 'left top',
      at : 'left top',
      collision: 'fit fit'
    },

    reposition: true, // allow jQuery position utility to reposition the keyboard on window resize
    usePreview: true, // preview added above keyboard if true, original input/textarea used if false
    alwaysOpen: false, // if true, the keyboard will always be visible
    initialFocus: true, // give the preview initial focus when the keyboard becomes visible
    stayOpen: true, // if true, keyboard will remain open even if the input loses focus.
    openOn: 'click', // Event (namespaced) on the input to reveal the keyboard. To disable it, just set it to ''.
    keyBinding: 'click', // When the character is added to the input
  })
}

function spotlightCursorMove (e) {
  var zoomAdjustment = userZoomLevel / newZoomLevel
  cursorPosition = { x: e.clientX, y: e.clientY }
  $('#eye-tracking-mask').css('background', 'radial-gradient(' +
      (zoomAdjustment * cursorSize) + 'px at '
      + (zoomAdjustment * e.clientX) + 'px ' + (zoomAdjustment * e.clientY) + 'px, ' +
      'rgba(255, 255, 255, 0) 60%, ' +
      'rgba(255, 255, 255, 0.02) 80%, ' +
      'rgba(150, 150, 150, 0.4) 100%)');
}

function spotlightCursorOn () {
  $('#eye-tracking-mask').css('background', 'rgba(150, 150, 150, 0.4)');
  $('body').on('mousemove', spotlightCursorMove);
}

function spotlightCursorOff () {
  $('body').unbind('mousemove')
  $('#eye-tracking-mask').css('background', '')
}

function sampleElements () {
  $('#eye-tracking-mask').css('pointer-events', 'none')
  var point = randomLocalisedPoint()
  var element = document.elementFromPoint(point.x, point.y)
  $(element).trigger('eye-targeting', [ point.x, point.y ])
  $('#eye-tracking-mask').css('pointer-events', 'auto')
}

function randomLocalisedPoint () {
  var selectionRadius = Math.pow(Math.abs(cursorSize), 1/4)
  var angle = Math.random()*Math.PI*2;
  x = Math.ceil(Math.cos(angle)*selectionRadius + cursorPosition.x);
  y = Math.ceil(Math.sin(angle)*selectionRadius + cursorPosition.y);
  return {x: x, y: y}
}

function startSamplingTargets () {
  potentialTargets = []
  $('body *').on('eye-targeting', pickTarget)
}

function stopSamplingTargets () {
  $('body *').off('eye-targeting')
  potentialTargets = []
}

function triggerSelectionOf (element) {
  try {
    $(element)[0].click()
  } catch (error) {
    console.log(error, 'Target element that could not be clicked is: ', element)
  }
  finally {
    cancelSelection()
  }
}

function cancelSelection () {
  clearSampleIntervals()
  newZoomLevel = userZoomLevel
  scroller.zoomTo(userZoomLevel, animateZoom, cursorPosition.x, cursorPosition.y);
  stopSamplingTargets()
  spotlightCursorOff()
  actionButtonActivated = false
  $('#eye-tracking-controls .action-button').removeClass('active')
}

function clearSampleIntervals () {
  sampleIntervalTimers.forEach(function (interval) {
    clearInterval(interval)
  })
  sampleIntervalTimers = []
}