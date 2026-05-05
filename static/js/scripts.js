const contentDir = 'contents/';
const configFile = 'config.yml';
const sectionNames = ['home', 'awards', 'experience', 'publications'];
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let revealObserver = null;
let prefersReducedMotion = motionQuery.matches;

window.addEventListener('DOMContentLoaded', () => {
    bindMotionPreference();
    initStarfield();
    initNavigation();
    initRevealAnimations();
    initInteractivePanels();
    initHeroParallax();
    loadConfig();
    loadSections();
});

function bindMotionPreference() {
    const handleMotionChange = (event) => {
        prefersReducedMotion = event.matches;

        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal-on-scroll').forEach((element) => {
                element.classList.add('is-visible');
            });
        }
    };

    if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionChange);
    } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionChange);
    }
}

function initNavigation() {
    const mainNav = document.body.querySelector('#mainNav');

    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });

        const syncNavState = () => {
            mainNav.classList.toggle('nav-scrolled', window.scrollY > 28);
        };

        syncNavState();
        document.addEventListener('scroll', syncNavState, { passive: true });
    }

    const navbarToggler = document.body.querySelector('.navbar-toggler');
    if (!navbarToggler) {
        return;
    }

    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );

    responsiveNavItems.forEach((responsiveNavItem) => {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
}

function initRevealAnimations() {
    const staticTargets = document.querySelectorAll(
        '.hero-panel, #avatar, .section-panel, .footer-panel'
    );

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -10% 0px',
            }
        );
    }

    registerRevealElements(staticTargets, 0);
}

function registerRevealElements(elements, startDelay) {
    Array.from(elements).forEach((element, index) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (!element.classList.contains('reveal-on-scroll')) {
            element.classList.add('reveal-on-scroll');
        }

        if (!element.style.getPropertyValue('--reveal-delay')) {
            element.style.setProperty('--reveal-delay', (startDelay + index * 90) + 'ms');
        }

        if (prefersReducedMotion || !revealObserver) {
            element.classList.add('is-visible');
            return;
        }

        revealObserver.observe(element);
    });
}

function initInteractivePanels() {
    const panels = document.querySelectorAll('.hero-panel, .section-panel, .footer-panel');

    panels.forEach((panel) => {
        if (panel.dataset.interactiveBound === 'true') {
            return;
        }

        panel.dataset.interactiveBound = 'true';
        resetPanelTilt(panel);

        panel.addEventListener('pointermove', (event) => {
            if (prefersReducedMotion) {
                return;
            }

            const rect = panel.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 8;
            const rotateX = (0.5 - y) * 8;

            panel.style.setProperty('--pointer-x', (x * 100).toFixed(2) + '%');
            panel.style.setProperty('--pointer-y', (y * 100).toFixed(2) + '%');
            panel.style.setProperty('--rotate-x', rotateX.toFixed(2) + 'deg');
            panel.style.setProperty('--rotate-y', rotateY.toFixed(2) + 'deg');
        });

        panel.addEventListener('pointerleave', () => {
            resetPanelTilt(panel);
        });
    });
}

function resetPanelTilt(panel) {
    panel.style.setProperty('--pointer-x', '50%');
    panel.style.setProperty('--pointer-y', '50%');
    panel.style.setProperty('--rotate-x', '0deg');
    panel.style.setProperty('--rotate-y', '0deg');
}

function initHeroParallax() {
    const heroSection = document.querySelector('.top-section');
    const backdrop = document.querySelector('.page-backdrop');

    if (!heroSection || !backdrop) {
        return;
    }

    let ticking = false;

    const syncParallax = () => {
        const offset = Math.min(window.scrollY, 420);
        const heroShift = Math.round(offset * -0.08);
        const backdropShift = Math.round(offset * -0.12);

        heroSection.style.setProperty('--hero-shift', heroShift + 'px');
        backdrop.style.setProperty('--backdrop-shift', backdropShift + 'px');
        ticking = false;
    };

    const requestParallaxUpdate = () => {
        if (prefersReducedMotion) {
            heroSection.style.setProperty('--hero-shift', '0px');
            backdrop.style.setProperty('--backdrop-shift', '0px');
            return;
        }

        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(syncParallax);
    };

    requestParallaxUpdate();
    document.addEventListener('scroll', requestParallaxUpdate, { passive: true });
}

function loadConfig() {
    fetch(contentDir + configFile)
        .then((response) => response.text())
        .then((text) => {
            const yml = jsyaml.load(text);

            Object.keys(yml).forEach((key) => {
                const element = document.getElementById(key);

                if (!element) {
                    console.log('Unknown id and value: ' + key + ',' + yml[key].toString());
                    return;
                }

                if (key === 'top-section-bg-text') {
                    animateHeroText(element, decodeHtml(String(yml[key])));
                    return;
                }

                element.innerHTML = yml[key];
            });
        })
        .catch((error) => console.log(error));
}

function loadSections() {
    marked.use({ mangle: false, headerIds: false });

    sectionNames.forEach((name) => {
        fetch(contentDir + name + '.md')
            .then((response) => response.text())
            .then((markdown) => {
                const target = document.getElementById(name + '-md');
                target.innerHTML = marked.parse(markdown);
                decorateSectionContent(target);

                if (window.MathJax && window.MathJax.typesetPromise) {
                    return MathJax.typesetPromise([target]);
                }

                if (window.MathJax && window.MathJax.typeset) {
                    MathJax.typeset([target]);
                }

                return null;
            })
            .catch((error) => console.log(error));
    });
}

function decorateSectionContent(target) {
    const children = Array.from(target.children);

    children.forEach((child, index) => {
        child.style.setProperty('--reveal-delay', (120 + index * 70) + 'ms');
    });

    registerRevealElements(children, 120);
}

function animateHeroText(element, text) {
    const characters = Array.from(text);

    if (prefersReducedMotion || characters.length === 0) {
        element.textContent = text;
        return;
    }

    let index = 0;
    element.textContent = '';
    element.classList.add('is-typing');

    const typeNext = () => {
        element.textContent += characters[index];
        index += 1;

        if (index >= characters.length) {
            element.classList.remove('is-typing');
            return;
        }

        const previousCharacter = characters[index - 1];
        const delay = previousCharacter === ' ' ? 45 : 75;
        window.setTimeout(typeNext, delay);
    };

    window.setTimeout(typeNext, 260);
}

function decodeHtml(value) {
    const helper = document.createElement('textarea');
    helper.innerHTML = value;
    return helper.value;
}

function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
        return;
    }

    const state = {
        width: 0,
        height: 0,
        scale: 1,
        frameId: null,
        stars: [],
        meteors: [],
        nextMeteorAt: 0,
        pointerX: 0,
        pointerY: 0,
        reducedMotion: prefersReducedMotion,
    };

    function createStar() {
        const palette = [
            '255,255,255',
            '178,220,255',
            '144,232,255',
            '196,205,255',
        ];

        return {
            x: Math.random() * state.width,
            y: Math.random() * state.height,
            radius: 0.45 + Math.random() * 1.7,
            alpha: 0.25 + Math.random() * 0.55,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.0006 + Math.random() * 0.0018,
            drift: (Math.random() - 0.5) * 0.045,
            depth: 0.4 + Math.random() * 1.4,
            color: palette[Math.floor(Math.random() * palette.length)],
        };
    }

    function createMeteor() {
        const travel = 0.32 + Math.random() * 0.18;
        return {
            x: Math.random() * state.width * 0.7 + state.width * 0.15,
            y: Math.random() * state.height * 0.25,
            length: 90 + Math.random() * 130,
            speed: 9 + Math.random() * 8,
            trailWidth: 1 + Math.random() * 1.4,
            travel,
            opacity: 0.24 + Math.random() * 0.28,
        };
    }

    function buildScene() {
        const area = state.width * state.height;
        const starCount = Math.max(120, Math.floor(area / 9500));
        state.stars = Array.from({ length: starCount }, createStar);
        state.meteors = [];
        state.nextMeteorAt = 1200 + Math.random() * 1600;
    }

    function resizeCanvas() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.scale = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(state.width * state.scale);
        canvas.height = Math.floor(state.height * state.scale);
        canvas.style.width = state.width + 'px';
        canvas.style.height = state.height + 'px';

        context.setTransform(state.scale, 0, 0, state.scale, 0, 0);

        buildScene();
        drawFrame(0);

        if (!state.reducedMotion) {
            startAnimation();
        }
    }

    function drawStars(timestamp) {
        state.stars.forEach((star) => {
            const pulse = state.reducedMotion
                ? star.alpha
                : star.alpha + Math.sin(timestamp * star.twinkle + star.phase) * 0.2;
            const alpha = Math.max(0.16, Math.min(1, pulse));
            const offsetX = state.pointerX * star.depth * 12;
            const offsetY = state.pointerY * star.depth * 9;

            if (!state.reducedMotion) {
                star.x += star.drift;

                if (star.x < -3) {
                    star.x = state.width + 3;
                } else if (star.x > state.width + 3) {
                    star.x = -3;
                }
            }

            context.beginPath();
            context.fillStyle = 'rgba(' + star.color + ',' + alpha + ')';
            context.shadowBlur = star.radius > 1.05 ? 14 * star.radius : 0;
            context.shadowColor = 'rgba(' + star.color + ',' + Math.min(alpha * 0.7, 0.5) + ')';
            context.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, Math.PI * 2);
            context.fill();
        });

        context.shadowBlur = 0;
    }

    function drawMeteors(timestamp) {
        if (timestamp >= state.nextMeteorAt) {
            state.meteors.push(createMeteor());
            state.nextMeteorAt = timestamp + 1800 + Math.random() * 4200;
        }

        state.meteors = state.meteors.filter((meteor) => {
            meteor.x += meteor.speed;
            meteor.y += meteor.speed * meteor.travel;

            const tailX = meteor.x - meteor.length;
            const tailY = meteor.y - meteor.length * meteor.travel;

            const gradient = context.createLinearGradient(
                meteor.x,
                meteor.y,
                tailX,
                tailY
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255,' + meteor.opacity + ')');
            gradient.addColorStop(0.5, 'rgba(173, 231, 255,' + meteor.opacity * 0.7 + ')');
            gradient.addColorStop(1, 'rgba(173, 231, 255,0)');

            context.beginPath();
            context.strokeStyle = gradient;
            context.lineWidth = meteor.trailWidth;
            context.moveTo(meteor.x, meteor.y);
            context.lineTo(tailX, tailY);
            context.stroke();

            return tailX <= state.width && tailY <= state.height;
        });
    }

    function drawFrame(timestamp) {
        context.clearRect(0, 0, state.width, state.height);
        drawStars(timestamp);

        if (!state.reducedMotion) {
            drawMeteors(timestamp);
            state.frameId = window.requestAnimationFrame(drawFrame);
        } else {
            state.frameId = null;
        }
    }

    function stopAnimation() {
        if (state.frameId) {
            window.cancelAnimationFrame(state.frameId);
            state.frameId = null;
        }
    }

    function startAnimation() {
        stopAnimation();
        state.frameId = window.requestAnimationFrame(drawFrame);
    }

    function handleMotionPreference(event) {
        state.reducedMotion = event.matches;
        prefersReducedMotion = event.matches;
        buildScene();

        if (state.reducedMotion) {
            stopAnimation();
            drawFrame(0);
        } else {
            startAnimation();
        }
    }

    function handlePointerMove(event) {
        if (state.reducedMotion || state.width === 0 || state.height === 0) {
            state.pointerX = 0;
            state.pointerY = 0;
            return;
        }

        state.pointerX = (event.clientX / state.width - 0.5) * 2;
        state.pointerY = (event.clientY / state.height - 0.5) * 2;
    }

    function resetPointer() {
        state.pointerX = 0;
        state.pointerY = 0;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('mouseleave', resetPointer, { passive: true });

    if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionPreference);
    } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionPreference);
    }

    resizeCanvas();
}
