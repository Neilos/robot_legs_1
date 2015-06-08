var gazeTime = 1500 // time staring at something until action is confirmed
var userSelectionDelay = 2500 // delay for user to focus before gazeTime starts
var activationInterval = 100 // delay between target guesses
var cursorSize = 90
var hoverDuration = 400 // time to allow for hovering animations before triggering clicks
var sampleSize = gazeTime / activationInterval // number of consecutive elements that should match
var cursorPosition = { x: -1000, y: -1000 }
var potentialTargets = []
var actionActivationTimer = []
var sampleIntervalTimer
var actionButtonActivated = false

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
          sampleIntervalTimer = setInterval(sampleElements, activationInterval)
        }, userSelectionDelay)
        clearInterval(actionActivationTimer)
      }, gazeTime)
    }
  },
  mouseleave: function (e) {
    clearInterval(actionActivationTimer)
  }
});

function guessTarget (e) {
  pickTarget(this)
  e.stopPropagation()
}

function pickTarget (newTarget) {
  potentialTargets.slice(-(sampleSize + 10))
  potentialTargets.push(newTarget)
  if (potentialTargets.length > sampleSize) {
    var recentTargetSamples = potentialTargets.slice(-sampleSize)
    var recentlySampledTargets = $.unique(recentTargetSamples)
    if (recentlySampledTargets.length = 1) {
      var targetElement = recentlySampledTargets[0]
      triggerSelectionOf(targetElement)
    }
  }
}

function positionControls () {
  var controlsHeight = $('#eye-tracking-controls').height();
  var offset = parseInt(window.innerHeight) - parseInt(controlsHeight);
  $('#eye-tracking-controls').css('top',offset);
  $('body').css('margin-bottom', controlsHeight);
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
      my : 'center top',
      at : 'center top',
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
  cursorPosition = { x: e.clientX, y: e.clientY }
  $('#eye-tracking-mask').css('background', 'radial-gradient(' +
      cursorSize + 'px at ' + e.clientX + 'px ' + e.clientY + 'px, ' +
      'rgba(255, 255, 255, 0) 60%, ' +
      'rgba(255, 255, 255, 0.02) 80%, ' +
      'rgba(150, 150, 150, 0.3) 100%)');
}

function spotlightCursorOn () {
  $('#eye-tracking-mask').css('background', 'rgba(150, 150, 150, 0.3)');
  $('body').on('mousemove', spotlightCursorMove);
}

function spotlightCursorOff () {
  $('body').unbind('mousemove')
  $('#eye-tracking-mask').css('background', '')
}

function sampleElements () {
  $('#eye-tracking-mask').css('pointer-events', 'none')
  var element = document.elementFromPoint(cursorPosition.x, cursorPosition.y)
  $(element).trigger('eye-targeting')
  $('#eye-tracking-mask').css('pointer-events', 'auto')
}

function startSamplingTargets () {
  potentialTargets = []
  $('body *').on('eye-targeting', guessTarget)
}

function stopSamplingTargets () {
  $('body *').off('eye-targeting')
  potentialTargets = []
}

function triggerSelectionOf (element) {
  try { $(element)[0].click() }
  finally {
    console.log('Target element is: ', element)
    stopSamplingTargets()
    spotlightCursorOff()
    actionButtonActivated = false
    $('#eye-tracking-controls .action-button').removeClass('active')
  }
}
