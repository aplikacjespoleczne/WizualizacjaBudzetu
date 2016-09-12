//In this file we check the current location and set 'active' classes on appropriate links - if applicalbe
(function(location) {
  "use strict"
  // FIX-ME add cross-browser compatibility
  document.addEventListener('DOMContentLoaded', addActiveClass);

  function addActiveClass() {
    var elements, selector;

    selector = "[href='" + location.pathname.slice(1) + "']" + ",[href='" + location.pathname + "']";
    elements = document.querySelectorAll(selector);

    elements.forEach(function(element) {
      element.classList.add('active');
    });
  }

}(window.location));
