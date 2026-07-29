document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleLabel = themeToggle?.querySelector('.theme-toggle-label');
    const storageKey = 'preferred-theme';
    const prefersLightQuery = window.matchMedia('(prefers-color-scheme: light)');
    const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollProgressBar = document.getElementById('scrollProgressBar');
    const activeSectionLabel = document.getElementById('activeSectionLabel');
    const navLinks = Array.from(document.querySelectorAll('.main-nav a'));
    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    const parallaxNodes = Array.from(document.querySelectorAll('[data-parallax]'));
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    const yearElement = document.getElementById('year');

    const sectionOrder = [
        { id: 'hero', label: 'Hero' },
        { id: 'about', label: 'About' },
        { id: 'experience', label: 'Experience' },
        { id: 'design-work', label: 'Design Work' },
        { id: 'projects', label: 'Projects' },
        { id: 'opensource', label: 'Open Source' },
        { id: 'skills', label: 'Skills' },
        { id: 'achievements', label: 'Achievements' },
        { id: 'contact', label: 'Contact' }
    ];

    const applyTheme = (theme, persist = false) => {
        const normalized = theme === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', normalized);

        if (themeToggle) {
            themeToggle.dataset.mode = normalized;
            themeToggle.setAttribute('aria-label', `Activate ${normalized === 'light' ? 'dark' : 'light'} mode`);
        }

        if (themeToggleLabel) {
            themeToggleLabel.textContent = normalized === 'light' ? 'Dark' : 'Light';
        }

        if (persist) {
            try {
                localStorage.setItem(storageKey, normalized);
            } catch (error) {
                console.warn('Unable to persist theme preference:', error);
            }
        }
    };

    applyTheme('dark');

    themeToggle?.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        applyTheme(current === 'light' ? 'dark' : 'light', true);
    });

    prefersLightQuery.addEventListener?.('change', (event) => {
        const hasStoredPreference = (() => {
            try {
                return Boolean(localStorage.getItem(storageKey));
            } catch {
                return false;
            }
        })();

        if (!hasStoredPreference) {
            applyTheme(event.matches ? 'light' : 'dark');
        }
    });

    const updateRevealDelay = () => {
        revealElements.forEach((element) => {
            const delay = Number(element.dataset.revealDelay);
            if (!Number.isNaN(delay)) {
                element.style.setProperty('--reveal-delay', `${delay}ms`);
            }
        });
    };

    const revealAll = () => {
        revealElements.forEach((element) => element.classList.add('is-visible'));
    };

    let revealObserver = null;
    const startRevealObserver = () => {
        if (!('IntersectionObserver' in window)) {
            revealAll();
            return;
        }

        revealObserver?.disconnect();
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver?.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

        revealElements.forEach((element) => revealObserver?.observe(element));
    };

    if (revealElements.length) {
        updateRevealDelay();
        if (prefersReducedMotionQuery.matches) {
            revealAll();
        } else {
            startRevealObserver();
        }
    }

    let parallaxRAF = null;
    const updateParallax = () => {
        const scrollY = window.scrollY;
        parallaxNodes.forEach((node) => {
            const speed = Number(node.dataset.parallax) || 0.08;
            node.style.setProperty('--parallax-offset', `${scrollY * speed * -1}px`);
        });
        parallaxRAF = null;
    };

    const scheduleParallax = () => {
        if (parallaxRAF === null) {
            parallaxRAF = requestAnimationFrame(updateParallax);
        }
    };

    const reduceMotion = prefersReducedMotionQuery.matches;
    if (reduceMotion) {
        parallaxNodes.forEach((node) => node.style.setProperty('--parallax-offset', '0px'));
    } else if (parallaxNodes.length) {
        updateParallax();
        window.addEventListener('scroll', scheduleParallax, { passive: true });
    }

    const updateScrollProgress = () => {
        if (!scrollProgressBar) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
        scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    const updateActiveSection = () => {
        const viewportCenter = window.innerHeight * 0.42;
        let currentSection = sectionOrder[0];

        for (const section of sectionOrder) {
            const element = document.getElementById(section.id);
            if (!element) continue;
            const rect = element.getBoundingClientRect();
            if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                currentSection = section;
                break;
            }
        }

        if (activeSectionLabel) {
            activeSectionLabel.textContent = currentSection.label;
        }

        navLinks.forEach((link) => {
            const target = link.getAttribute('href');
            const active = target === `#${currentSection.id}`;
            link.classList.toggle('is-active', active);
        });
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateScrollProgress();
            updateActiveSection();
            if (!reduceMotion && parallaxNodes.length) {
                scheduleParallax();
            }
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        updateScrollProgress();
        updateActiveSection();
    });

    updateScrollProgress();
    updateActiveSection();

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    if (cursorDot && cursorRing && !reduceMotion) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let cursorFrame = null;

        const animateCursor = () => {
            ringX += (mouseX - ringX) * 0.14;
            ringY += (mouseY - ringY) * 0.14;
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
            cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            cursorFrame = requestAnimationFrame(animateCursor);
        };

        window.addEventListener('pointermove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            if (!cursorFrame) {
                animateCursor();
            }
        }, { passive: true });

        animateCursor();
    }
});
