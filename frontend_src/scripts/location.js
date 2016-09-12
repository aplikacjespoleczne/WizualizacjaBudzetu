//In this file we check the current location and set appropriate classes on links - if applicalbe
(function(location) {
  "use strict"
  // FIX-ME add cross-browser compatibility
  document.addEventListener('DOMContentLoaded', addActiveClass);

  function addActiveClass() {
    var element, selector;

    selector = ".main-footer-links [href='" + location.pathname.slice(1) + "']";
    element = document.querySelector(selector);
    element.classList.add('active');
  }

}(window.location));
