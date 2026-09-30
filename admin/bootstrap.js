// Arrencada del CMS. Va en un fitxer separat (i no inline a index.html) per
// poder servir l'admin amb un CSP que no permeti 'unsafe-inline' als scripts:
// així res del contingut renderitzat al preview pot executar JavaScript.
(function () {
  "use strict";

  var CMS = window.CMS;
  if (!CMS) {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.innerHTML =
        '<p style="font-family:Inter,sans-serif;color:#e8e8ed;padding:2rem">' +
        "No s'ha pogut carregar el bundle del CMS.</p>";
    });
    return;
  }

  CMS.registerPreviewStyle("/admin/style.css?v=14");
  CMS.init();
})();