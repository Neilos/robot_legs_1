console.log("loaded")

var active = true

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  if (active) {
    active = false
    console.log('inactive')
    chrome.browserAction.setIcon({
      "path": {
        "19": "images/inactive_icon_19.png",
        "38": "images/inactive_icon_38.png"
      }
    });
  } else {
    active = true
    console.log('active')
    chrome.browserAction.setIcon({
      "path": {
        "19": "images/active_icon_19.png",
        "38": "images/active_icon_38.png"
      }
    });
  }

});
