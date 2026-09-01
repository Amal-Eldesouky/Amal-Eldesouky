document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // BACKGROUND ANIMATION: Project Management Network
    // =============================================
    // Draws a subtle, animated network of nodes and
    // connections that evoke workflow diagrams, Gantt
    // chart nodes, and task dependency graphs.
    // =============================================

    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let mouse = { x: -9999, y: -9999 };
    const CONNECTION_DIST = 200;
    const MOUSE_RADIUS = 180;
    const NODE_COUNT_FACTOR = 0.00004; // nodes per sq-pixel

    // PM-themed icons drawn on select nodes
    const drawIcons = {
        // small checkbox
        checkbox: (x, y, size, alpha) => {
            ctx.save();
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = 'rgba(6,182,212,' + alpha + ')';
            ctx.lineWidth = 1.2;
            const s = size * 0.7;
            ctx.strokeRect(x - s / 2, y - s / 2, s, s);
            // checkmark
            ctx.beginPath();
            ctx.moveTo(x - s * 0.25, y);
            ctx.lineTo(x - s * 0.05, y + s * 0.25);
            ctx.lineTo(x + s * 0.3, y - s * 0.2);
            ctx.stroke();
            ctx.restore();
        },
        // small circle/milestone
        milestone: (x, y, size, alpha) => {
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = 'rgba(99,102,241,' + alpha + ')';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            // diamond shape
            const s = size * 0.4;
            ctx.moveTo(x, y - s);
            ctx.lineTo(x + s, y);
            ctx.lineTo(x, y + s);
            ctx.lineTo(x - s, y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        },
        // small bar (gantt)
        bar: (x, y, size, alpha) => {
            ctx.save();
            ctx.globalAlpha = alpha * 0.35;
            ctx.fillStyle = 'rgba(139,92,246,' + alpha + ')';
            const w = size * 1.2;
            const h = size * 0.3;
            ctx.beginPath();
            ctx.roundRect(x - w / 2, y - h / 2, w, h, 2);
            ctx.fill();
            ctx.restore();
        }
    };

    const iconTypes = Object.keys(drawIcons);

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 2 + 1.5;
            this.baseAlpha = Math.random() * 0.25 + 0.08;
            this.alpha = this.baseAlpha;
            // very slow drift
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            // some nodes get a PM icon
            this.hasIcon = Math.random() < 0.2;
            this.iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];
            this.iconSize = Math.random() * 8 + 10;
            // pulse
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.005 + 0.003;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // wrap around
            if (this.x < -50) this.x = width + 50;
            if (this.x > width + 50) this.x = -50;
            if (this.y < -50) this.y = height + 50;
            if (this.y > height + 50) this.y = -50;

            // pulse alpha
            this.pulsePhase += this.pulseSpeed;
            this.alpha = this.baseAlpha + Math.sin(this.pulsePhase) * 0.06;
        }

        draw() {
            // node dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, ' + this.alpha + ')';
            ctx.fill();

            // glow on mouse proximity
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
                const intensity = 1 - dist / MOUSE_RADIUS;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(99, 102, 241, ' + (intensity * 0.25) + ')';
                ctx.fill();
            }

            // icon
            if (this.hasIcon) {
                drawIcons[this.iconType](this.x, this.y - 12, this.iconSize, this.alpha);
            }
        }
    }

    function createNodes() {
        const count = Math.floor(width * height * NODE_COUNT_FACTOR);
        nodes = [];
        for (let i = 0; i < Math.max(count, 30); i++) {
            nodes.push(new Node());
        }
    }

    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = 'rgba(99, 102, 241, ' + alpha + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    // Data flow particles along connections
    const flowParticles = [];
    const MAX_FLOW = 15;

    function spawnFlowParticle() {
        if (flowParticles.length >= MAX_FLOW || nodes.length < 2) return;
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        // find a nearby node
        let b = null;
        for (let i = 0; i < nodes.length; i++) {
            const dx = a.x - nodes[i].x;
            const dy = a.y - nodes[i].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > 20 && d < CONNECTION_DIST) {
                b = nodes[i];
                break;
            }
        }
        if (!b) return;
        flowParticles.push({
            ax: a.x, ay: a.y,
            bx: b.x, by: b.y,
            t: 0,
            speed: Math.random() * 0.005 + 0.003
        });
    }

    function updateFlowParticles() {
        for (let i = flowParticles.length - 1; i >= 0; i--) {
            const p = flowParticles[i];
            p.t += p.speed;
            if (p.t >= 1) {
                flowParticles.splice(i, 1);
                continue;
            }
            const x = p.ax + (p.bx - p.ax) * p.t;
            const y = p.ay + (p.by - p.ay) * p.t;
            const alpha = Math.sin(p.t * Math.PI) * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, ' + alpha + ')';
            ctx.fill();
        }
    }

    let frameCount = 0;

    function animate() {
        ctx.clearRect(0, 0, width, height);

        nodes.forEach(n => n.update());
        drawConnections();
        nodes.forEach(n => n.draw());

        frameCount++;
        if (frameCount % 40 === 0) spawnFlowParticle();
        updateFlowParticles();

        requestAnimationFrame(animate);
    }

    // Mouse tracking (passive, non-intrusive)
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('resize', () => {
        resize();
        createNodes();
    });

    resize();
    createNodes();
    animate();


    // =============================================
    // NAVBAR, SCROLL & SECTION ANIMATIONS
    // =============================================

    // 1. Navbar Scroll Effect & Mobile Menu Toggle
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinks.classList.contains('nav-active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // 2. Active Navigation Link on Scroll
    const sections = document.querySelectorAll('section, footer');
    
    const highlightNav = () => {
        let scrollY = window.scrollY;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 150;
            const sectionId = current.getAttribute('id');
            
            if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector('.nav-links a[href*=' + sectionId + ']').classList.add('active');
            } else {
                document.querySelector('.nav-links a[href*=' + sectionId + ']').classList.remove('active');
            }
        });
    };
    
    window.addEventListener('scroll', highlightNav);

    // 3. Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in, .slide-up');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                
                // If it's a skill category, animate the progress bars inside
                if (entry.target.classList.contains('skill-category')) {
                    const progressBars = entry.target.querySelectorAll('.progress');
                    progressBars.forEach(bar => {
                        const width = bar.getAttribute('data-width');
                        bar.style.width = width;
                    });
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    fadeElements.forEach(el => {
        appearOnScroll.observe(el);
    });

});
