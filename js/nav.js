/**
 * nav.js — Molecular Solutions
 * ─────────────────────────────────────────────────────────────────
 * Responsabilidades:
 *   1. Sticky header: agrega .header--scrolled al hacer scroll
 *   2. Hamburger menu: toggle del panel off-canvas en móvil
 *   3. Cierre del menú al hacer click en un enlace o fuera del panel
 *   4. Active link: marca el enlace de la sección visible en viewport
 *   5. Actualiza aria-current y aria-expanded para accesibilidad
 *
 * No tiene dependencias externas.
 * Se carga con defer en el <head> del index.html.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Constantes ────────────────────────────────────────────── */
  const SCROLL_THRESHOLD  = 80;          // px para activar .header--scrolled
  const CLASS_SCROLLED    = 'header--scrolled';
  const CLASS_OPEN        = 'header--open';
  const CLASS_NAV_ACTIVE  = 'header__nav-link--active';
  const ARIA_CURRENT      = 'aria-current';
  const ARIA_EXPANDED     = 'aria-expanded';

  /* ── Referencias al DOM ────────────────────────────────────── */
  const header        = document.getElementById('site-header');
  const hamburgerBtn  = document.getElementById('hamburger-btn');
  const primaryNav    = document.getElementById('primary-nav');
  const navLinks      = document.querySelectorAll('.header__nav-link');

  /* Verificación defensiva: si falta algún elemento, salir */
  if (!header || !hamburgerBtn || !primaryNav) {
    console.warn('nav.js: No se encontraron los elementos del header.');
    return;
  }


  /* ════════════════════════════════════════════════════════════
     1. STICKY HEADER
     Añade / quita .header--scrolled según la posición del scroll.
     Se usa requestAnimationFrame para limitar el trabajo en el
     hilo principal y evitar layout thrashing.
  ════════════════════════════════════════════════════════════ */

  let lastScrollY  = 0;
  let ticking      = false;  // Flag para rAF throttling

  function updateHeaderOnScroll() {
    const scrollY = window.scrollY;

    if (scrollY > SCROLL_THRESHOLD) {
      header.classList.add(CLASS_SCROLLED);
    } else {
      header.classList.remove(CLASS_SCROLLED);
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderOnScroll);
      ticking = true;
    }
  }, { passive: true });   // passive: true → mejora rendimiento del scroll

  /* Ejecutar al cargar por si la página ya está desplazada */
  updateHeaderOnScroll();


  /* ════════════════════════════════════════════════════════════
     2. HAMBURGER MENU — Toggle
     Agrega / quita .header--open en el <header>.
     Actualiza aria-expanded en el botón.
     Bloquea el scroll del body mientras el menú está abierto.
  ════════════════════════════════════════════════════════════ */

  function openMenu() {
    header.classList.add(CLASS_OPEN);
    hamburgerBtn.setAttribute(ARIA_EXPANDED, 'true');
    hamburgerBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
    document.body.style.overflow = 'hidden';
    /*
      CRÍTICO: el backdrop-filter del header crea un contexto de composición
      que hace que el panel nav (aunque sea position:fixed) herede la
      transparencia/blur del header, volviéndose translúcido.
      Desactivarlo mientras el menú está abierto resuelve el problema.
    */
    header.style.backdropFilter = 'none';
    header.style.webkitBackdropFilter = 'none';
  }

  function closeMenu() {
    header.classList.remove(CLASS_OPEN);
    hamburgerBtn.setAttribute(ARIA_EXPANDED, 'false');
    hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    document.body.style.overflow = '';
    /* Restaurar el backdrop-filter del header al cerrar */
    header.style.backdropFilter = '';
    header.style.webkitBackdropFilter = '';
  }

  function toggleMenu() {
    const isOpen = header.classList.contains(CLASS_OPEN);
    isOpen ? closeMenu() : openMenu();
  }

  hamburgerBtn.addEventListener('click', toggleMenu);


  /* ════════════════════════════════════════════════════════════
     3. CIERRE DEL MENÚ
     El menú se cierra al:
       a) Hacer click en cualquier enlace de la nav
       b) Hacer click fuera del panel (overlay)
       c) Presionar la tecla Escape
       d) Redimensionar la ventana a ancho > 768px
  ════════════════════════════════════════════════════════════ */

  /* a) Click en enlace */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (header.classList.contains(CLASS_OPEN)) {
        closeMenu();
      }
    });
  });

  /* b) Click fuera del panel (el overlay es el ::before del nav,
        pero el click se detecta en el document) */
  document.addEventListener('click', function (event) {
    // Si el menú está abierto y el click NO fue dentro del header
    if (
      header.classList.contains(CLASS_OPEN) &&
      !header.contains(event.target)
    ) {
      closeMenu();
    }
  });

  /* c) Tecla Escape */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && header.classList.contains(CLASS_OPEN)) {
      closeMenu();
      hamburgerBtn.focus(); // Devolver foco al botón (accesibilidad)
    }
  });

  /* d) Resize — si se pasa a desktop, cerrar el menú para
        evitar que quede el overflow: hidden en el body */
  const mediaQuery = window.matchMedia('(min-width: 769px)');

  function handleBreakpointChange(event) {
    if (event.matches && header.classList.contains(CLASS_OPEN)) {
      closeMenu();
    }
  }

  mediaQuery.addEventListener('change', handleBreakpointChange);


  /* ════════════════════════════════════════════════════════════
     4. ACTIVE LINK — IntersectionObserver
     Marca el enlace de nav correspondiente a la sección
     actualmente visible en el viewport.

     Técnica: observar cada sección anclada (#inicio, #productos…)
     y actualizar la clase activa cuando entra en pantalla.
  ════════════════════════════════════════════════════════════ */

  /* Secciones que queremos observar (deben tener id coincidente con href) */
  const sectionIds   = ['inicio', 'productos', 'nosotros', 'clientes', 'contacto'];
  const sections     = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);   // Filtrar los null por si algún id no existe aún

  /* Map de id → enlace de nav para acceso rápido */
  const linkMap = {};
  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      linkMap[href.slice(1)] = link;
    }
  });

  /* Función para actualizar el link activo */
  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      link.classList.remove(CLASS_NAV_ACTIVE);
      link.removeAttribute(ARIA_CURRENT);
    });

    const activeLink = linkMap[id];
    if (activeLink) {
      activeLink.classList.add(CLASS_NAV_ACTIVE);
      activeLink.setAttribute(ARIA_CURRENT, 'page');
    }
  }

  /* IntersectionObserver: se dispara cuando una sección entra/sale */
  const observerOptions = {
    /*
      rootMargin negativo superior = la sección se considera "activa"
      cuando su borde superior cruza el 20% superior de la pantalla,
      evitando el salto entre el header y el inicio del contenido.
    */
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, observerOptions);

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  /* Activar "inicio" por defecto al cargar */
  setActiveLink('inicio');


  /* ════════════════════════════════════════════════════════════
     5. AÑO DINÁMICO EN EL FOOTER
     Actualiza el span#footer-year con el año actual.
     Se hace aquí (en lugar de main.js) para aprovechar que
     nav.js ya tiene acceso al DOM completamente cargado.
  ════════════════════════════════════════════════════════════ */

  const yearSpan = document.getElementById('footer-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }


})(); /* IIFE — encapsula el módulo y evita contaminar el scope global */