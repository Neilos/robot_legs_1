var gazeTime = 1500 // time staring at something until action is confirmed
var userSelectionDelay = 2000 // delay for user to focus before gazeTime starts
var guessInterval = 10 // delay between target guesses
var cursorSize = 90
var hoverDuration = 400 // time to allow for hovering animations before triggering clicks
var sampleSize = gazeTime / guessInterval // number of consecutive elements that should match
var cursorPosition = { x: -1000, y: -1000 }
var potentialTargets = []
var guessingTimer;

var controls =  '<div id="eye-tracking-controls" style="position: fixed; display: none;">' +
                  '<div class="action-controls" >' +
                    '<button class="action-button" >ACTION</button>' +
                    '<button class="cancel-action-button" style="display: none;">CANCEL ACTION</button>' +
                    '<button disabled="true" class="keyboard-button" >KEYBOARD</button>' +
                  '</div>' +
                  '<div class="scroll-controls" >' +
                    '<button disabled="true" class="scroll-button" >SCROLL</button>' +
                    '<button disabled="true" class="up-button" >UP   </button>' +
                    '<button disabled="true" class="down-button" >DOWN </button>' +
                    '<button disabled="true" class="left-button" >LEFT </button>' +
                    '<button disabled="true" class="right-button" >RIGHT</button>' +
                    '<button disabled="true" class="cancel-scroll-button" style="display: none;">CANCEL SCROLL</button>' +
                  '</div>' +
                  '<div class="browser-controls" >' +
                    '<button disabled="true" class="back-button" >BACK</button>' +
                    '<button disabled="true" class="forward-button" >FORWARD</button>' +
                    '<button disabled="true" class="refresh-button" >REFRESH</button>' +
                    '<button disabled="true" class="home-button" >HOME</button>' +
                    '<button disabled="true" class="settings-button" >SETTINGS</button>' +
                  '</div>' +
                '</div>'

$('html').append(controls)
positionControls();
spotlightCursorOn()

$(window).resize(function(e){
  positionControls();
});

$('#eye-tracking-controls').on({
  mouseover: function (e) { },
  mouseout: function (e) { }
});

$('#eye-tracking-controls .action-button').on('click', function (e) {
  potentialTargets = []

  $('body *').on('eye-tracking-targeting', function (e) {
    potentialTargets.slice(-(sampleSize + 10))
    potentialTargets.push(this)
    pickTarget()
    e.stopPropagation()
  })

  $('body').on('mousemove', function (e) {
    spotlightCursorMove(e)
    cursorPosition = { x: e.clientX, y: e.clientY }
  });

  startSamplingTargets()
  showCancelButton()
})

$('#eye-tracking-controls .cancel-action-button').on('click', function (e) {
  spotlightCursorOff()
  stopSamplingTargets()
  hideCancelButton()
})

function hideCancelButton () {
  $('#eye-tracking-controls .cancel-action-button').hide()
}

function showCancelButton () {
  $('#eye-tracking-controls .cancel-action-button').show()
}

function pickTarget () {
  if (potentialTargets.length > sampleSize) {
    var recentTargetSamples = potentialTargets.slice(-sampleSize)
    var recentlySampledTargets = $.unique(recentTargetSamples)
    if (recentlySampledTargets.length = 1) {
      var targetElement = recentlySampledTargets[0]
      triggerSelection(targetElement)
      stopSamplingTargets()
      spotlightCursorOff()
      hideCancelButton()
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

function spotlightCursorMove (e) {
  $('#eye-tracking-mask').css('background', 'radial-gradient(' +
      cursorSize + 'px at ' + e.clientX + 'px ' + e.clientY + 'px, ' +
      'rgba(255, 255, 255, 0) 60%, ' +
      'rgba(255, 255, 255, 0.02) 80%, ' +
      'rgba(150, 150, 150, 0.32) 100%)');
}

function spotlightCursorOff () {
  $('body').unbind('mousemove')
  $('#eye-tracking-mask').css('background', '')
}

function spotlightCursorOn () {
  var overlay = '<div id="eye-tracking-mask" style="position: fixed; top: 0; left: 0; display: block;"></div>'
  $('body').append(overlay)
}

function sampleTargets () {
  $('#eye-tracking-mask').css('pointer-events', 'none')
  var element = document.elementFromPoint(cursorPosition.x, cursorPosition.y)
  $(element).trigger('eye-tracking-targeting')
  $('#eye-tracking-mask').css('pointer-events', 'auto')
}

function startSamplingTargets () {
  setTimeout(function () {
    guessingTimer = setInterval(sampleTargets, guessInterval)
  }, userSelectionDelay)
}

function stopSamplingTargets () {
  $('body *').off('eye-tracking-targeting')
  clearInterval(guessingTimer)
}

function triggerSelection (element) {
  try { $(element).mouseover() }
  finally {
    try { $(element)[0].focus() }
    finally {
      try { $(element).select() }
      finally {
        setTimeout(function () {
          try { $(element)[0].click() }
          catch (e) {
            try { $(element).click() }
            finally { console.log('second click attempt')}
          }
          finally {
            console.log('Target element is: ', element)
          }
        }, hoverDuration)
      }
    }
  }
}
