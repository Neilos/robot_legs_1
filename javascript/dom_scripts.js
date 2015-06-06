var controls =  '<div id="eye-tracking-controls" style="position: fixed; display: none;">' +
                  'I am a footer' +
                '</div>'

var overlay =  '<div id="eye-tracking-mask" style="position: fixed; top: 0; left: 0; display: block;"></div>'

$('body').append(overlay)
$('html').append(controls)
$(function(){
  $(window).resize(function(e){
    positionControls();
  });

  positionControls();
});

function positionControls() {
  var windHeight = $(window).height();
  var footerHeight = $('#eye-tracking-controls').height();
  var offset = parseInt(windHeight) - parseInt(footerHeight);
  $('#eye-tracking-controls').css('top',offset);
  $('body').css('margin-bottom', footerHeight);
  $('#eye-tracking-controls').css('display','block'); // show it once it's positioned
}

var gazeTime = 1000;
var timer;
var cursorSize = 90

function spotlightCursorOn(e) {
  $('#eye-tracking-mask').css('background', 'radial-gradient(' +
      cursorSize + 'px at ' + e.clientX + 'px ' + e.clientY + 'px, ' +
      'rgba(255, 255, 255, 0) 60%, ' +
      'rgba(255, 255, 255, 0.02) 80%, ' +
      'rgba(150, 150, 150, 0.32) 100%)');
}

function spotlightCursorOff() {
  $('#eye-tracking-mask').css('background', 'rgba(255, 255, 255, 0)');
}

$('#eye-tracking-controls').on({
  mouseover: function (e) {
    spotlightCursorOff()
    // console.log(e.clientX)
    // console.log(e.clientY)
    // timer = setTimeout(function () {
      // console.log(document.elementFromPoint(e.clientX, e.clientY));
      // console.log(e.currentTarget)
    // }, gazeTime);
  },
  mouseout: function () {
    // clearTimeout(timer);
    $('body').on('mousemove', function (e) {
      spotlightCursorOn(e)
      // console.log(document.elementFromPoint(e.clientX, e.clientY));
    });
  }
});

