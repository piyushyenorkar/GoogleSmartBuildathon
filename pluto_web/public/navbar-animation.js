class PlutoAnimation {
    constructor() {
        this.logoO = document.getElementById('logoO');
        this.logoOContainer = document.querySelector('.logo-o-container');
        this.navLinksData = document.querySelectorAll('.nav-links li a'); // Select all nav links

        // Dynamic Elements
        this.fireball = document.createElement('div');
        this.fireball.className = 'fireball';
        document.body.appendChild(this.fireball);

        this.plutoPlanet = document.createElement('div');
        this.plutoPlanet.className = 'pluto-planet';
        document.body.appendChild(this.plutoPlanet);
        this.isAnimating = false;

        // SPA Check: Skip if already seen
        if (localStorage.getItem('plutoAnimationSeen') === 'true') {
             // Immediately substitute with the final state
             this.logoO.classList.add('hidden');
             const navbar = document.querySelector('.navbar');
             if (navbar && this.plutoPlanet.parentElement !== navbar) {
                 navbar.appendChild(this.plutoPlanet);
             }
             const logoRect = this.logoO.getBoundingClientRect();
             const navbarRect = navbar ? navbar.getBoundingClientRect() : {left: 0, top: 0};
             this.plutoPlanet.style.width = logoRect.width + 'px';
             this.plutoPlanet.style.height = logoRect.height + 'px';
             this.plutoPlanet.style.left = (logoRect.left - navbarRect.left) + 'px';
             this.plutoPlanet.style.top = (logoRect.top - navbarRect.top) + 'px';
             this.plutoPlanet.style.opacity = '1';
             this.plutoPlanet.style.zIndex = '40';
             this.plutoPlanet.classList.add('spinning');
             return;
        }

        // Initial auto-start
        this.checkAndStart();
    }

    async checkAndStart() {
        // Wait for profile avatar to be appearing in DOM (populated by auth.js)
        let attempts = 0;
        while (!document.querySelector('.profile-avatar') && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        this.profileAvatar = document.querySelector('.profile-avatar');

        if (this.profileAvatar && this.logoO) {
            // Additional delay as requested (reduced to 0.8s)
            setTimeout(() => {
                if (!this.isAnimating) this.animate();
            }, 800);
        } else {
            console.warn('PlutoAnimation: Profile avatar or Logo not found, animation skipped.');
        }
    }

    createFlameParticle(x, y) {
        // ... (keep existing implementation, it uses fixed body coords so creates in body)
        // Wait, if planet is in navbar, does it affect particles? No, particles are simpler.
        // Actually, let's keep particles on body for simplicity of global coords.
        const particle = document.createElement('div');
        particle.className = 'flame-particle';

        const size = Math.random() * 20 + 10;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        const colors = [
            'rgba(255, 120, 0, 0.8)',
            'rgba(255, 60, 0, 0.8)',
            'rgba(255, 200, 100, 0.6)',
            'rgba(200, 0, 0, 0.7)'
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 ${size}px ${colors[Math.floor(Math.random() * colors.length)]}`;

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 500);
    }

    createFireSpark(centerX, centerY) {
        const spark = document.createElement('div');
        spark.className = 'fire-spark';

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        spark.style.left = centerX + 'px';
        spark.style.top = centerY + 'px';
        spark.style.setProperty('--tx', tx + 'px');
        spark.style.setProperty('--ty', ty + 'px');
        spark.style.animation = `sparkFly ${Math.random() * 0.5 + 0.3}s ease-out forwards`;

        document.body.appendChild(spark);

        setTimeout(() => spark.remove(), 800);
    }

    async burnO() {
        return new Promise((resolve) => {
            const logoRect = this.logoO.getBoundingClientRect();
            const centerX = logoRect.left + logoRect.width / 2;
            const centerY = logoRect.top + logoRect.height / 2;

            // Start burning animation
            this.logoO.classList.add('burning');

            // Create fire sparks during burning
            const sparkInterval = setInterval(() => {
                for (let i = 0; i < 3; i++) {
                    this.createFireSpark(
                        centerX + (Math.random() - 0.5) * 20,
                        centerY + (Math.random() - 0.5) * 20
                    );
                }
            }, 100);

            // Stop sparks and resolve after burning animation
            setTimeout(() => {
                clearInterval(sparkInterval);
                this.logoO.classList.remove('burning');
                resolve();
            }, 1500);
        });
    }

    animateFireball(startX, startY, endX, endY, duration, onComplete) {
        const startTime = Date.now();
        const fireball = this.fireball;

        // Set size based on target text
        const size = this.logoO.getBoundingClientRect().width;
        fireball.style.width = size + 'px';
        fireball.style.height = size + 'px';

        fireball.style.opacity = '1';
        fireball.classList.add('active');

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentX = startX + (endX - startX) * easeProgress;
            const currentY = startY + (endY - startY) * easeProgress;

            fireball.style.left = currentX + 'px';
            fireball.style.top = currentY + 'px';

            // Create flame trail
            if (Math.random() > 0.5) {
                this.createFlameParticle(
                    currentX + size / 2 - Math.random() * 15,
                    currentY + size / 2 - Math.random() * 15
                );
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                fireball.classList.remove('active');
                fireball.style.opacity = '0';
                if (onComplete) onComplete();
            }
        };

        animate();
    }

    monitorCollisions(duration) {
        const startTime = Date.now();
        const checkedElements = new Set();

        const check = () => {
            if (Date.now() - startTime >= duration) return;

            const fireballRect = this.fireball.getBoundingClientRect();
            const fireballX = fireballRect.left + fireballRect.width / 2;
            const fireballY = fireballRect.top + fireballRect.height / 2;

            this.navLinksData.forEach(element => {
                if (!checkedElements.has(element)) {
                    const rect = element.getBoundingClientRect();
                    const distance = Math.sqrt(
                        Math.pow(fireballX - (rect.left + rect.width / 2), 2) +
                        Math.pow(fireballY - (rect.top + rect.height / 2), 2)
                    );

                    // Increased distance for earlier trigger (smooth approach)
                    if (distance < 100) {
                        checkedElements.add(element);
                        element.classList.add('fire-effect');

                        // Increase timeout to match new animation duration (800ms)
                        setTimeout(() => {
                            element.classList.remove('fire-effect');
                        }, 800);
                    }
                }
            });

            requestAnimationFrame(check);
        };

        check();
    }

    async transformToPlanet(viewportCenterX, viewportCenterY) {
        return new Promise((resolve) => {
            // Move planet to Navbar container if not already
            const navbar = document.querySelector('.navbar');
            if (this.plutoPlanet.parentElement !== navbar) {
                navbar.appendChild(this.plutoPlanet);
            }

            // Set size match
            const size = this.logoO.getBoundingClientRect().width;
            this.plutoPlanet.style.width = size + 'px';
            this.plutoPlanet.style.height = size + 'px';

            // Calculate RELATIVE position inside navbar
            const navbarRect = navbar.getBoundingClientRect();
            // viewportCenterX is profile center in viewport
            // Relative X = (ViewportX - NavbarLeft)
            const relativeX = (viewportCenterX - size / 2) - navbarRect.left;
            const relativeY = (viewportCenterY - size / 2) - navbarRect.top;

            this.plutoPlanet.style.left = relativeX + 'px';
            this.plutoPlanet.style.top = relativeY + 'px';

            this.plutoPlanet.style.opacity = '0';
            this.plutoPlanet.style.zIndex = '20'; // Behind profile (50) but in navbar

            // Wait 0.5 sec time gap (User requested 1/2 sec)
            setTimeout(() => {
                this.plutoPlanet.style.opacity = '1';

                // Spin animation
                this.plutoPlanet.classList.add('spinning');

                setTimeout(() => {
                    resolve();
                }, 1500);
            }, 500); // reduced wait to 500ms
        });
    }

    async animate() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // 1. Burn the simple O
        await this.burnO();

        // Hide original O
        this.logoO.classList.add('hidden');

        // Coords match viewport
        const logoRect = this.logoO.getBoundingClientRect();
        const profileRect = this.profileAvatar.getBoundingClientRect();

        const startX = logoRect.left;
        const startY = logoRect.top;

        // Target is center of profile
        const endX = profileRect.left + profileRect.width / 2 - logoRect.width / 2;
        const endY = profileRect.top + profileRect.height / 2 - logoRect.height / 2;

        // 2. Fireball Travel to Profile
        const travelDuration = 800;
        this.monitorCollisions(travelDuration);

        await new Promise(resolve => {
            this.animateFireball(startX, startY, endX, endY, travelDuration, resolve);
        });

        // 3. Transform to Planet (HIDDEN behind profile) & Reveal
        await this.transformToPlanet(
            profileRect.left + profileRect.width / 2,
            profileRect.top + profileRect.height / 2
        );

        // 4. Return Journey with Freeze Effects & Submarine Flow
        const planet = this.plutoPlanet;
        const navbar = document.querySelector('.navbar');
        const navbarRect = navbar.getBoundingClientRect();

        const startReturnX = parseFloat(planet.style.left);
        const startReturnY = parseFloat(planet.style.top);

        const currentLogoRect = this.logoO.getBoundingClientRect();
        const finalX = currentLogoRect.left - navbarRect.left;
        const finalY = currentLogoRect.top - navbarRect.top;

        // "Create Event" is the 2nd link (navLinksData[1])
        // "Explore Events" is the 1st link (navLinksData[0])

        let createEventLink = this.navLinksData[1];
        let exploreEventLink = this.navLinksData[0];

        // --- Step 1: Move to "Create Event" (Collision/Freeze) ---
        let collisionX = startReturnX + (finalX - startReturnX) * 0.3; // Default
        let collisionY = startReturnY + (finalY - startReturnY) * 0.3;

        if (createEventLink) {
            const rect = createEventLink.getBoundingClientRect();
            // Target the center of "Create Event"
            collisionX = (rect.left + rect.width / 2) - navbarRect.left - (planet.offsetWidth / 2);
            collisionY = (rect.top + rect.height / 2) - navbarRect.top - (planet.offsetHeight / 2);
        }

        await new Promise(resolve => {
            this.animateMove(planet, startReturnX, startReturnY, collisionX, collisionY, 800, resolve);
        });

        // Trigger Freeze on "Create Event"
        if (createEventLink) {
            createEventLink.classList.add('freeze-effect');
            setTimeout(() => createEventLink.classList.remove('freeze-effect'), 1000);
        }

        // --- Step 2: Recoil & Dive ---
        const recoilX = collisionX + (startReturnX - collisionX) * 0.2;
        const recoilY = collisionY + (startReturnY - collisionY) * 0.2; // Slight bounce up/right

        await new Promise(resolve => {
            this.animateMove(planet, collisionX, collisionY, recoilX, recoilY, 300, resolve, 'ease-out');
        });

        // Dive
        planet.style.zIndex = '-1';

        // --- Step 3: Move to "Explore Events" (Submerged) ---
        let surfaceX = recoilX + (finalX - recoilX) * 0.6; // Default
        let surfaceY = recoilY; // Stay level-ish

        if (exploreEventLink) {
            const rect = exploreEventLink.getBoundingClientRect();
            // Surface just BEFORE (Right side of) Explore Events
            surfaceX = (rect.right - navbarRect.left) + 20;
            surfaceY = (rect.top + rect.height / 2) - navbarRect.top - (planet.offsetHeight / 2);
        }

        await new Promise(resolve => {
            this.animateMove(planet, recoilX, recoilY, surfaceX, surfaceY, 800, resolve, 'linear');
        });

        // Surface
        planet.style.zIndex = '40';

        // --- Step 4: Flyover "Explore Events" (Freeze it!) & Land ---

        // Start moving to Final
        const finalTravel = this.animateMove(planet, surfaceX, surfaceY, finalX, finalY, 1000, null, 'ease-out');

        // Trigger Freeze on "Explore Events" mid-flight (as it passes over)
        setTimeout(() => {
            if (exploreEventLink) {
                exploreEventLink.classList.add('freeze-effect');
                setTimeout(() => exploreEventLink.classList.remove('freeze-effect'), 1000);
            }
        }, 100); // Trigger shortly after surfacing

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for travel to finish

        // 5. Final State
        const currentLogoRectFinal = this.logoO.getBoundingClientRect();
        planet.style.left = (currentLogoRectFinal.left - navbarRect.left) + 'px';
        planet.style.top = (currentLogoRectFinal.top - navbarRect.top) + 'px';

        localStorage.setItem('plutoAnimationSeen', 'true');
    }

    animateMove(element, startX, startY, endX, endY, duration, onComplete, easing = 'ease-in-out') {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            let ease = progress;
            if (easing === 'ease-in-out') {
                ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            } else if (easing === 'ease-out') {
                ease = 1 - Math.pow(1 - progress, 3);
            } else if (easing === 'linear') {
                ease = progress;
            }

            const currX = startX + (endX - startX) * ease;
            const currY = startY + (endY - startY) * ease;

            element.style.left = currX + 'px';
            element.style.top = currY + 'px';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };
        animate();
    }
}
window.PlutoAnimation = PlutoAnimation;

// Fallback for initial load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (document.getElementById('logoO') && !window.plutoAnimationInstance) {
            window.plutoAnimationInstance = new PlutoAnimation();
        }
    }, 500);
});
