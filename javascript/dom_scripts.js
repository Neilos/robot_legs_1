$('body').prepend('<h1 id="hello">HELLO</h1>')

var gazeTime = 1000;
var timer;

$('#hello').on({
  mouseover: function () {
    timer = setTimeout(function () {
       alert("hello again")
    }, gazeTime);
  },
  mouseout: function () {
    clearTimeout(timer);
  }
});