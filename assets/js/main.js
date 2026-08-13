(function () {
  "use strict";

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Dropdown "Servicios" (click to toggle on touch, hover on desktop via CSS) ---------- */
  var dropdownToggle = document.querySelector(".has-dropdown .nav-toplevel");
  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", function () {
      dropdownToggle.closest(".has-dropdown").classList.toggle("is-open");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Quote form (sends via /api/send-quote, with file attachment) ---------- */
  var form = document.getElementById("quoteForm");
  var submitBtn = document.getElementById("submitBtn");
  var statusEl = document.getElementById("formStatus");
  var MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

  function showStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = "block";
    statusEl.style.color = isError ? "#c0392b" : "#1a7a3c";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.nombre.value.trim() || !form.telefono.value.trim() || !form.email.value.trim()) {
        form.reportValidity();
        return;
      }

      var fileInput = document.getElementById("archivo");
      if (fileInput && fileInput.files[0] && fileInput.files[0].size > MAX_FILE_BYTES) {
        showStatus("El archivo adjunto supera el límite de 4 MB. Por favor adjunte un archivo más liviano.", true);
        return;
      }

      var originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Enviando...";
      showStatus("Enviando su solicitud...", false);

      var formData = new FormData(form);

      fetch("/api/send-quote", { method: "POST", body: formData })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            showStatus("¡Solicitud enviada! Nuestro equipo se pondrá en contacto pronto.", false);
            form.reset();
          } else {
            showStatus(result.data.error || "No se pudo enviar la solicitud. Intenta por WhatsApp.", true);
          }
        })
        .catch(function () {
          showStatus("No se pudo enviar la solicitud. Por favor intenta por WhatsApp.", true);
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
    });
  }

  /* ---------- Selector + detail panel: click a thumbnail/item, swap shared panel smoothly ---------- */
  function initSwapSelector(selectorId, cardSelector, panelWrapId, panelInnerId, fields) {
    var selector = document.getElementById(selectorId);
    var panelWrap = document.getElementById(panelWrapId);
    var panelInner = document.getElementById(panelInnerId);
    if (!selector || !panelWrap || !panelInner) return;

    var fieldEls = {};
    Object.keys(fields).forEach(function (key) {
      fieldEls[key] = document.getElementById(fields[key]);
    });

    var buttons = selector.querySelectorAll(cardSelector);

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-active")) return;

        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        var startHeight = panelWrap.offsetHeight;
        panelWrap.style.height = startHeight + "px";
        panelInner.classList.add("is-switching");

        window.setTimeout(function () {
          Object.keys(fieldEls).forEach(function (key) {
            fieldEls[key].textContent = btn.dataset[key];
          });
          panelInner.classList.remove("is-switching");

          panelWrap.style.height = "auto";
          var newHeight = panelWrap.offsetHeight;
          panelWrap.style.height = startHeight + "px";
          panelWrap.offsetHeight; // force reflow

          requestAnimationFrame(function () {
            panelWrap.style.height = newHeight + "px";
          });

          panelWrap.addEventListener("transitionend", function handler(e) {
            if (e.propertyName === "height") {
              panelWrap.style.height = "auto";
              panelWrap.removeEventListener("transitionend", handler);
            }
          });
        }, 200);
      });
    });
  }

  initSwapSelector("materialSelector", ".material-card", "materialPanelWrap", "materialPanelInner", {
    num: "panelNum",
    title: "panelTitle",
    subtitle: "panelSubtitle",
    desc: "panelDesc",
    apps: "panelApps",
  });

  /* ---------- Marquee: duplicate content for seamless loop ---------- */
  var track = document.getElementById("marqueeTrack");
  if (track) {
    track.innerHTML += track.innerHTML;
  }
})();
