/**
 * slider.js — Molecular Solutions
 * ─────────────────────────────────────────────────────────────────
 * Responsabilidades:
 *   1. Mover el .hero__track con transform: translateX
 *   2. Autoplay configurable con pausa en hover
 *   3. Navegación con flechas prev/next
 *   4. Navegación con dots
 *   5. Swipe táctil (móvil)
 *   6. Navegación con teclado (←  →)
 *   7. Pausa cuando la pestaña está oculta (Page Visibility API)
 *   8. Gestión de aria-selected en dots y clases activas en slides
 *
 * Configuración rápida: modificar el objeto CONFIG.
 * No tiene dependencias externas.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Configuración ─────────────────────────────────────────── */
  const CONFIG = {
    autoplay:      true,       // Activar/desactivar autoplay
    interval:      5000,       // Milisegundos entre slides
    pauseOnHover:  true,       // Pausar al pasar el cursor
    swipeThreshold: 50,        // Píxeles mínimos para reconocer un swipe
    transitionClass: 'hero__track--no-transition'  // Para saltos sin animación
  };

  /* ── Referencias al DOM ────────────────────────────────────── */
  const slider  = document.querySelector('.hero__slider');
  const track   = document.getElementById('hero-track');
  const slides  = document.querySelectorAll('.hero__slide');
  const dots    = document.querySelectorAll('.hero__dot');
  const btnPrev = document.getElementById('hero-prev');
  const btnNext = document.getElementById('hero-next');

  /* Verificación defensiva */
  if (!slider || !track || slides.length === 0) {
    console.warn('slider.js: No se encontraron los elementos del hero slider.');
    return;
  }

  /* ── Estado interno ─────────────────────────────────────────── */
  let currentIndex  = 0;
  let totalSlides   = slides.length;
  let autoplayTimer = null;
  let isTransitioning = false;  // Evita clics rápidos durante la transición

  /* Variables para swipe táctil */
  let touchStartX   = 0;
  let touchStartY   = 0;
  let isDragging    = false;


  /* ════════════════════════════════════════════════════════════
     FUNCIÓN PRINCIPAL: goToSlide(index)
     Mueve el track, actualiza dots y clases activas.
  ════════════════════════════════════════════════════════════ */

  function goToSlide(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    /* ── Normalizar índice (loop circular) ── */
    if (index < 0) {
      index = totalSlides - 1;
    } else if (index >= totalSlides) {
      index = 0;
    }

    /* ── Mover el track ── */
    track.style.transform = `translateX(-${index * 100}%)`;

    /* ── Actualizar clase activa en slides ── */
    slides.forEach(function (slide, i) {
      slide.classList.toggle('hero__slide--active', i === index);
    });

    /* ── Actualizar dots ── */
    dots.forEach(function (dot, i) {
      const isActive = i === index;
      dot.classList.toggle('hero__dot--active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    currentIndex = index;

    /*
      Liberar el flag de transición una vez que termina la animación CSS.
      El tiempo debe coincidir con la transition del .hero__track en CSS (700ms).
    */
    setTimeout(function () {
      isTransitioning = false;
    }, 720);
  }

  /* ── Helpers ── */
  function nextSlide() { goToSlide(currentIndex + 1); }
  function prevSlide() { goToSlide(currentIndex - 1); }


  /* ════════════════════════════════════════════════════════════
     AUTOPLAY
  ════════════════════════════════════════════════════════════ */

  function startAutoplay() {
    if (!CONFIG.autoplay) return;
    stopAutoplay(); // Limpiar timer previo antes de crear uno nuevo
    autoplayTimer = setInterval(nextSlide, CONFIG.interval);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  /* Pausar en hover */
  if (CONFIG.pauseOnHover) {
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
  }

  /* Pausar cuando la pestaña está oculta */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });


  /* ════════════════════════════════════════════════════════════
     CONTROLES: FLECHAS
  ════════════════════════════════════════════════════════════ */

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      prevSlide();
      /* Reiniciar autoplay para evitar cambio inmediato después de click manual */
      if (CONFIG.autoplay) {
        stopAutoplay();
        startAutoplay();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      nextSlide();
      if (CONFIG.autoplay) {
        stopAutoplay();
        startAutoplay();
      }
    });
  }


  /* ════════════════════════════════════════════════════════════
     CONTROLES: DOTS
  ════════════════════════════════════════════════════════════ */

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goToSlide(i);
      if (CONFIG.autoplay) {
        stopAutoplay();
        startAutoplay();
      }
    });

    /* Soporte de teclado en los dots (Enter y Space) */
    dot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToSlide(i);
      }
    });
  });


  /* ════════════════════════════════════════════════════════════
     NAVEGACIÓN CON TECLADO — flechas ← →
     Solo cuando el slider tiene el foco o está en viewport
  ════════════════════════════════════════════════════════════ */

  document.addEventListener('keydown', function (event) {
    /* Ignorar si el usuario está escribiendo en un input */
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    /* Solo actuar si el slider es visible en el viewport */
    const rect = slider.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevSlide();
      if (CONFIG.autoplay) { stopAutoplay(); startAutoplay(); }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextSlide();
      if (CONFIG.autoplay) { stopAutoplay(); startAutoplay(); }
    }
  });


  /* ════════════════════════════════════════════════════════════
     SWIPE TÁCTIL
     Detectar la dirección del deslizamiento con touchstart / touchend.
     Se ignoran swipes predominantemente verticales para no interferir
     con el scroll normal de la página.
  ════════════════════════════════════════════════════════════ */

  slider.addEventListener('touchstart', function (e) {
    touchStartX  = e.changedTouches[0].clientX;
    touchStartY  = e.changedTouches[0].clientY;
    isDragging   = true;
  }, { passive: true });

  slider.addEventListener('touchend', function (e) {
    if (!isDragging) return;
    isDragging = false;

    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    /* Ignorar si el movimiento es más vertical que horizontal */
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (Math.abs(deltaX) >= CONFIG.swipeThreshold) {
      if (deltaX < 0) {
        /* Swipe izquierda → siguiente */
        nextSlide();
      } else {
        /* Swipe derecha → anterior */
        prevSlide();
      }
      if (CONFIG.autoplay) { stopAutoplay(); startAutoplay(); }
    }
  }, { passive: true });

  /* Cancelar swipe si se sale del slider */
  slider.addEventListener('touchcancel', function () {
    isDragging = false;
  }, { passive: true });


  /* ════════════════════════════════════════════════════════════
     INICIALIZACIÓN
     Activar el primer slide y arrancar el autoplay.
  ════════════════════════════════════════════════════════════ */

  goToSlide(0);
  startAutoplay();


})(); /* IIFE */