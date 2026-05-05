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
        '.hero-title-wrap, #avatar, .section-panel, .footer-panel'
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
    const panels = document.querySelectorAll('.section-panel, .footer-panel');

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
    const starfield = document.querySelector('#starfield');

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
        if (starfield) {
            starfield.style.setProperty('--backdrop-shift', backdropShift + 'px');
        }
        ticking = false;
    };

    const requestParallaxUpdate = () => {
        if (prefersReducedMotion) {
            heroSection.style.setProperty('--hero-shift', '0px');
            backdrop.style.setProperty('--backdrop-shift', '0px');
            if (starfield) {
                starfield.style.setProperty('--backdrop-shift', '0px');
            }
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
    const container = document.getElementById('starfield');
    const THREE = window.THREE;

    if (!container || !THREE) {
        return;
    }

    let renderer = null;

    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
    } catch (error) {
        console.log(error);
        return;
    }

    const state = {
        width: 0,
        height: 0,
        frameId: null,
        lastTimestamp: 0,
        pointerTargetX: 0,
        pointerTargetY: 0,
        pointerX: 0,
        pointerY: 0,
        pointerEnergy: 0,
        pointerWorldX: 0,
        pointerWorldY: 0,
        lastPointerClientX: null,
        lastPointerClientY: null,
        reducedMotion: prefersReducedMotion,
        layers: [],
        nebulae: [],
        meteors: [],
        nextMeteorAt: 0,
    };

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050c18, 0.00085);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 2200);
    camera.position.set(0, 0, 560);

    const starGroup = new THREE.Group();
    scene.add(starGroup);

    function createCanvasTexture(width, height, painter) {
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = width;
        textureCanvas.height = height;

        const textureContext = textureCanvas.getContext('2d');
        if (!textureContext) {
            return null;
        }

        painter(textureContext, width, height);

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    const starTexture = createCanvasTexture(80, 80, (textureContext, width, height) => {
        const gradient = textureContext.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            width / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(210,236,255,0.95)');
        gradient.addColorStop(0.45, 'rgba(120,200,255,0.45)');
        gradient.addColorStop(1, 'rgba(120,200,255,0)');
        textureContext.fillStyle = gradient;
        textureContext.fillRect(0, 0, width, height);
    });

    const nebulaTexture = createCanvasTexture(512, 512, (textureContext, width, height) => {
        const gradient = textureContext.createRadialGradient(
            width / 2,
            height / 2,
            width * 0.05,
            width / 2,
            height / 2,
            width / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.18, 'rgba(170,220,255,0.38)');
        gradient.addColorStop(0.42, 'rgba(96,170,255,0.16)');
        gradient.addColorStop(0.72, 'rgba(60,120,255,0.06)');
        gradient.addColorStop(1, 'rgba(40,80,200,0)');
        textureContext.fillStyle = gradient;
        textureContext.fillRect(0, 0, width, height);
    });

    const meteorTexture = createCanvasTexture(512, 64, (textureContext, width, height) => {
        const gradient = textureContext.createLinearGradient(0, height / 2, width, height / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.3, 'rgba(150,220,255,0.08)');
        gradient.addColorStop(0.7, 'rgba(170,235,255,0.48)');
        gradient.addColorStop(0.92, 'rgba(255,255,255,0.98)');
        gradient.addColorStop(1, 'rgba(255,255,255,1)');

        textureContext.fillStyle = gradient;
        textureContext.fillRect(0, 0, width, height);

        const head = textureContext.createRadialGradient(
            width * 0.92,
            height / 2,
            0,
            width * 0.92,
            height / 2,
            height * 0.9
        );
        head.addColorStop(0, 'rgba(255,255,255,1)');
        head.addColorStop(0.35, 'rgba(200,240,255,0.8)');
        head.addColorStop(1, 'rgba(200,240,255,0)');
        textureContext.fillStyle = head;
        textureContext.fillRect(width - height * 2, 0, height * 2, height);
    });

    const ringTexture = createCanvasTexture(320, 320, (textureContext, width, height) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width * 0.33;

        textureContext.strokeStyle = 'rgba(155,225,255,0.85)';
        textureContext.lineWidth = width * 0.035;
        textureContext.shadowBlur = width * 0.08;
        textureContext.shadowColor = 'rgba(120,210,255,0.65)';
        textureContext.beginPath();
        textureContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
        textureContext.stroke();
    });

    const pointerGlowTexture = createCanvasTexture(320, 320, (textureContext, width, height) => {
        const gradient = textureContext.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            width / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.18, 'rgba(185,235,255,0.5)');
        gradient.addColorStop(0.45, 'rgba(108,200,255,0.16)');
        gradient.addColorStop(1, 'rgba(108,200,255,0)');
        textureContext.fillStyle = gradient;
        textureContext.fillRect(0, 0, width, height);
    });

    const glowGeometry = new THREE.SphereGeometry(115, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x163158,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.set(-120, 30, -420);
    scene.add(glowMesh);

    const rimGeometry = new THREE.SphereGeometry(165, 32, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
        color: 0x234d86,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.position.set(180, -80, -560);
    scene.add(rimMesh);

    function getViewSizeAtDepth(depth) {
        const distance = Math.abs(camera.position.z - depth);
        const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
        return {
            height,
            width: height * camera.aspect,
        };
    }

    function createStarLayer(options) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(options.count * 3);
        const colors = new Float32Array(options.count * 3);
        const color = new THREE.Color();
        const direction = new THREE.Vector3();

        for (let index = 0; index < options.count; index += 1) {
            direction
                .set(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                )
                .normalize()
                .multiplyScalar(options.radiusMin + Math.random() * options.radiusRange);

            const baseIndex = index * 3;
            positions[baseIndex] = direction.x * (0.7 + Math.random() * 0.6);
            positions[baseIndex + 1] = direction.y * (0.7 + Math.random() * 0.8);
            positions[baseIndex + 2] = direction.z;

            color.setHSL(
                options.hueBase + (Math.random() - 0.5) * options.hueVariance,
                options.saturation,
                options.lightnessBase + Math.random() * options.lightnessVariance
            );

            colors[baseIndex] = color.r;
            colors[baseIndex + 1] = color.g;
            colors[baseIndex + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: options.size,
            transparent: true,
            opacity: options.opacity,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: starTexture || null,
        });

        const points = new THREE.Points(geometry, material);
        points.userData = {
            baseOpacity: options.opacity,
            rotateX: options.rotateX,
            rotateY: options.rotateY,
            rotateZ: options.rotateZ,
            floatAmplitude: options.floatAmplitude,
            floatSpeed: options.floatSpeed,
            reactiveX: options.reactiveX,
            reactiveY: options.reactiveY,
            phase: Math.random() * Math.PI * 2,
        };

        starGroup.add(points);
        state.layers.push(points);
    }

    function createNebula(options) {
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: nebulaTexture || null,
                color: options.color,
                transparent: true,
                opacity: options.opacity,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );

        sprite.position.set(options.x, options.y, options.z);
        sprite.scale.set(options.scaleX, options.scaleY, 1);
        sprite.material.rotation = options.rotation;
        sprite.userData = {
            baseX: options.x,
            baseY: options.y,
            baseScaleX: options.scaleX,
            baseScaleY: options.scaleY,
            baseOpacity: options.opacity,
            breathSpeed: options.breathSpeed,
            breathDepth: options.breathDepth,
            driftX: options.driftX,
            driftY: options.driftY,
            reactiveX: options.reactiveX,
            reactiveY: options.reactiveY,
            phase: Math.random() * Math.PI * 2,
        };

        scene.add(sprite);
        state.nebulae.push(sprite);
    }

    function createMeteor() {
        const material = new THREE.SpriteMaterial({
            map: meteorTexture || null,
            color: 0xc9f1ff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const meteor = new THREE.Sprite(material);
        meteor.visible = false;
        meteor.userData = {
            active: false,
            vx: 0,
            vy: 0,
            life: 0,
            age: 0,
            baseOpacity: 0,
            baseScaleX: 0,
            baseScaleY: 0,
            exitX: 0,
            exitY: 0,
        };
        scene.add(meteor);
        state.meteors.push(meteor);
    }

    const pointerGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: pointerGlowTexture || null,
            color: 0x7fdcff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    pointerGlow.position.set(0, 0, -120);
    pointerGlow.scale.set(120, 120, 1);
    scene.add(pointerGlow);

    const pointerRing = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: ringTexture || null,
            color: 0xc0ecff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    pointerRing.position.set(0, 0, -118);
    pointerRing.scale.set(90, 90, 1);
    scene.add(pointerRing);

    createStarLayer({
        count: 1500,
        radiusMin: 300,
        radiusRange: 920,
        size: 2.1,
        opacity: 0.9,
        hueBase: 0.58,
        hueVariance: 0.08,
        saturation: 0.52,
        lightnessBase: 0.72,
        lightnessVariance: 0.18,
        rotateX: 0.00005,
        rotateY: 0.00018,
        rotateZ: 0.00004,
        floatAmplitude: 5,
        floatSpeed: 0.4,
        reactiveX: 12,
        reactiveY: 8,
    });

    createStarLayer({
        count: 900,
        radiusMin: 220,
        radiusRange: 640,
        size: 1.4,
        opacity: 0.65,
        hueBase: 0.56,
        hueVariance: 0.1,
        saturation: 0.44,
        lightnessBase: 0.62,
        lightnessVariance: 0.22,
        rotateX: -0.00003,
        rotateY: -0.00012,
        rotateZ: 0.00005,
        floatAmplitude: 8,
        floatSpeed: 0.55,
        reactiveX: 20,
        reactiveY: 12,
    });

    createStarLayer({
        count: 260,
        radiusMin: 120,
        radiusRange: 260,
        size: 3.1,
        opacity: 0.4,
        hueBase: 0.6,
        hueVariance: 0.05,
        saturation: 0.4,
        lightnessBase: 0.75,
        lightnessVariance: 0.15,
        rotateX: 0.00001,
        rotateY: 0.00007,
        rotateZ: -0.00003,
        floatAmplitude: 10,
        floatSpeed: 0.7,
        reactiveX: 28,
        reactiveY: 18,
    });

    createNebula({
        color: 0x4da6ff,
        opacity: 0.12,
        x: -180,
        y: 70,
        z: -540,
        scaleX: 880,
        scaleY: 720,
        rotation: 0.35,
        breathSpeed: 0.55,
        breathDepth: 0.07,
        driftX: 28,
        driftY: 22,
        reactiveX: 22,
        reactiveY: 16,
    });

    createNebula({
        color: 0x7a8fff,
        opacity: 0.08,
        x: 220,
        y: -50,
        z: -680,
        scaleX: 980,
        scaleY: 820,
        rotation: -0.42,
        breathSpeed: 0.42,
        breathDepth: 0.09,
        driftX: 22,
        driftY: 18,
        reactiveX: 16,
        reactiveY: 12,
    });

    createNebula({
        color: 0x77e2ff,
        opacity: 0.06,
        x: 40,
        y: -150,
        z: -420,
        scaleX: 620,
        scaleY: 520,
        rotation: 0.15,
        breathSpeed: 0.68,
        breathDepth: 0.06,
        driftX: 16,
        driftY: 10,
        reactiveX: 24,
        reactiveY: 14,
    });

    for (let index = 0; index < 5; index += 1) {
        createMeteor();
    }

    function spawnMeteor(timestamp) {
        const meteor = state.meteors.find((item) => !item.userData.active);
        if (!meteor) {
            return;
        }

        const depth = -140 - Math.random() * 320;
        const view = getViewSizeAtDepth(depth);
        const startX = -view.width * (0.6 + Math.random() * 0.18);
        const startY = view.height * (0.15 + Math.random() * 0.45);
        const travelDistance = view.width * (1.35 + Math.random() * 0.25);
        const dropDistance = view.height * (0.28 + Math.random() * 0.18);
        const life = 34 + Math.random() * 20;

        meteor.position.set(startX, startY, depth);
        meteor.scale.set(180 + Math.random() * 120, 16 + Math.random() * 8, 1);
        meteor.material.rotation = THREE.MathUtils.degToRad(-18 - Math.random() * 8);
        meteor.material.opacity = 0;
        meteor.visible = true;

        meteor.userData.active = true;
        meteor.userData.age = 0;
        meteor.userData.life = life;
        meteor.userData.vx = travelDistance / life;
        meteor.userData.vy = -dropDistance / life;
        meteor.userData.baseOpacity = 0.5 + Math.random() * 0.24;
        meteor.userData.baseScaleX = meteor.scale.x;
        meteor.userData.baseScaleY = meteor.scale.y;
        meteor.userData.exitX = view.width * 0.78;
        meteor.userData.exitY = -view.height * 0.62;

        state.nextMeteorAt = timestamp + 1400 + Math.random() * 2600;
    }

    function updateMeteors(timestamp, delta) {
        if (!state.reducedMotion && timestamp >= state.nextMeteorAt) {
            spawnMeteor(timestamp);
        }

        state.meteors.forEach((meteor) => {
            if (!meteor.userData.active) {
                return;
            }

            meteor.userData.age += delta;
            meteor.position.x += meteor.userData.vx * delta;
            meteor.position.y += meteor.userData.vy * delta;

            const progress = meteor.userData.age / meteor.userData.life;
            const fadeIn = Math.min(progress / 0.14, 1);
            const fadeOut = Math.min((1 - progress) / 0.28, 1);
            const opacity = meteor.userData.baseOpacity * Math.min(fadeIn, fadeOut, 1);

            meteor.material.opacity = Math.max(opacity, 0);
            meteor.scale.x = meteor.userData.baseScaleX * (0.94 + progress * 0.2);
            meteor.scale.y = meteor.userData.baseScaleY * (1.05 - progress * 0.18);

            if (
                progress >= 1 ||
                meteor.position.x > meteor.userData.exitX ||
                meteor.position.y < meteor.userData.exitY
            ) {
                meteor.userData.active = false;
                meteor.visible = false;
                meteor.material.opacity = 0;
            }
        });
    }

    function resizeRenderer() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        camera.aspect = state.width / Math.max(state.height, 1);
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setSize(state.width, state.height, false);
        state.nextMeteorAt = state.lastTimestamp + 900 + Math.random() * 1400;

        renderScene(0);

        if (!state.reducedMotion) {
            startAnimation();
        }
    }

    function renderScene(timestamp) {
        const delta = state.lastTimestamp
            ? Math.min((timestamp - state.lastTimestamp) / 16.666, 2.2)
            : 1;
        state.lastTimestamp = timestamp;

        state.pointerX += (state.pointerTargetX - state.pointerX) * 0.045;
        state.pointerY += (state.pointerTargetY - state.pointerY) * 0.045;
        state.pointerWorldX += ((state.pointerX * 210) - state.pointerWorldX) * 0.08;
        state.pointerWorldY += ((-state.pointerY * 120) - state.pointerWorldY) * 0.08;
        state.pointerEnergy *= state.reducedMotion ? 0.88 : 0.96;

        const time = timestamp * 0.00009;

        if (!state.reducedMotion) {
            starGroup.rotation.y = state.pointerX * 0.22;
            starGroup.rotation.x = state.pointerY * 0.12;
            starGroup.position.x = state.pointerX * 10;
            starGroup.position.y = -state.pointerY * 6;
            camera.position.x = state.pointerX * 26;
            camera.position.y = -state.pointerY * 18;
            camera.position.z = 560 + Math.sin(time * 6) * 6;
            glowMesh.position.x = -120 + state.pointerX * 18;
            glowMesh.position.y = 30 + Math.sin(time * 8) * 18 - state.pointerY * 10;
            glowMesh.material.opacity = 0.16 + Math.sin(time * 8.5) * 0.04 + state.pointerEnergy * 0.06;
            rimMesh.position.x = 180 + Math.cos(time * 7) * 14 - state.pointerX * 12;
            rimMesh.position.y = -80 + Math.sin(time * 5.5) * 10;
            rimMesh.material.opacity = 0.07 + Math.cos(time * 7.3) * 0.015 + state.pointerEnergy * 0.04;
        } else {
            starGroup.position.x = 0;
            starGroup.position.y = 0;
            camera.position.x = 0;
            camera.position.y = 0;
            camera.position.z = 560;
            glowMesh.material.opacity = 0.18;
            rimMesh.material.opacity = 0.08;
        }

        state.layers.forEach((layer, index) => {
            if (!state.reducedMotion) {
                layer.rotation.x += layer.userData.rotateX;
                layer.rotation.y += layer.userData.rotateY;
                layer.rotation.z += layer.userData.rotateZ;
                layer.position.x = state.pointerX * layer.userData.reactiveX;
                layer.position.y =
                    Math.sin(time * (index + 2) * layer.userData.floatSpeed + layer.userData.phase)
                    * layer.userData.floatAmplitude
                    - state.pointerY * layer.userData.reactiveY;
                layer.material.opacity = layer.userData.baseOpacity * (
                    0.9 + Math.sin(time * 9 + layer.userData.phase) * 0.06 + state.pointerEnergy * 0.06
                );
            } else {
                layer.position.x = 0;
                layer.position.y = 0;
                layer.material.opacity = layer.userData.baseOpacity;
            }
        });

        state.nebulae.forEach((sprite, index) => {
            const breathe = Math.sin(time * (sprite.userData.breathSpeed * 9) + sprite.userData.phase);
            const scaleFactor = 1 + breathe * sprite.userData.breathDepth + state.pointerEnergy * 0.05;
            sprite.scale.set(
                sprite.userData.baseScaleX * scaleFactor,
                sprite.userData.baseScaleY * scaleFactor,
                1
            );

            if (!state.reducedMotion) {
                sprite.position.x =
                    sprite.userData.baseX +
                    Math.cos(time * (index + 2) * 3.2 + sprite.userData.phase) * sprite.userData.driftX +
                    state.pointerX * sprite.userData.reactiveX;
                sprite.position.y =
                    sprite.userData.baseY +
                    Math.sin(time * (index + 1.4) * 2.6 + sprite.userData.phase) * sprite.userData.driftY -
                    state.pointerY * sprite.userData.reactiveY;
                sprite.material.opacity = sprite.userData.baseOpacity * (
                    0.78 + (breathe + 1) * 0.12 + state.pointerEnergy * 0.08
                );
            } else {
                sprite.position.x = sprite.userData.baseX;
                sprite.position.y = sprite.userData.baseY;
                sprite.material.opacity = sprite.userData.baseOpacity;
            }
        });

        pointerGlow.position.set(state.pointerWorldX, state.pointerWorldY, -120);
        pointerRing.position.set(state.pointerWorldX, state.pointerWorldY, -118);

        if (!state.reducedMotion) {
            pointerGlow.material.opacity = 0.05 + state.pointerEnergy * 0.22;
            pointerGlow.scale.setScalar(120 + state.pointerEnergy * 70 + Math.sin(time * 10) * 6);
            pointerRing.material.opacity = state.pointerEnergy * 0.18;
            pointerRing.material.rotation += 0.004;
            pointerRing.scale.setScalar(90 + state.pointerEnergy * 120 + Math.sin(time * 7) * 10);
        } else {
            pointerGlow.material.opacity = 0;
            pointerRing.material.opacity = 0;
        }

        updateMeteors(timestamp, delta);
        renderer.render(scene, camera);
    }

    function drawFrame(timestamp) {
        renderScene(timestamp);
        if (!state.reducedMotion) {
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
        state.lastTimestamp = 0;
        state.frameId = window.requestAnimationFrame(drawFrame);
    }

    function handleMotionPreference(event) {
        state.reducedMotion = event.matches;
        prefersReducedMotion = event.matches;

        if (state.reducedMotion) {
            stopAnimation();
            state.pointerEnergy = 0;
            renderScene(0);
        } else {
            startAnimation();
        }
    }

    function handlePointerMove(event) {
        if (state.reducedMotion || state.width === 0 || state.height === 0) {
            state.pointerTargetX = 0;
            state.pointerTargetY = 0;
            return;
        }

        if (state.lastPointerClientX !== null && state.lastPointerClientY !== null) {
            const deltaX = event.clientX - state.lastPointerClientX;
            const deltaY = event.clientY - state.lastPointerClientY;
            const speed = Math.min(Math.hypot(deltaX, deltaY) / 180, 1);
            state.pointerEnergy = Math.min(1, state.pointerEnergy + 0.08 + speed * 0.55);
        } else {
            state.pointerEnergy = Math.min(1, state.pointerEnergy + 0.08);
        }

        state.lastPointerClientX = event.clientX;
        state.lastPointerClientY = event.clientY;
        state.pointerTargetX = (event.clientX / state.width - 0.5) * 2;
        state.pointerTargetY = (event.clientY / state.height - 0.5) * 2;
    }

    function resetPointer() {
        state.pointerTargetX = 0;
        state.pointerTargetY = 0;
        state.lastPointerClientX = null;
        state.lastPointerClientY = null;
    }

    window.addEventListener('resize', resizeRenderer);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('mouseleave', resetPointer, { passive: true });

    if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionPreference);
    } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionPreference);
    }

    resizeRenderer();
}
