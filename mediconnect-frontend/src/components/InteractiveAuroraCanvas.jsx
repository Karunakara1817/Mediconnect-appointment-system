import { useEffect, useRef } from "react";

const THEME_HUES = {
    PATIENT: { primary: 172, secondary: 196, accent: 156 },
    DOCTOR: { primary: 202, secondary: 222, accent: 184 },
    ADMIN: { primary: 262, secondary: 228, accent: 292 },
};

function hsla(h, s, l, a) {
    const hue = ((h % 360) + 360) % 360;
    return "hsla(" + hue.toFixed(1) + ", " + s + "%, " + l + "%, " + a + ")";
}

export default function InteractiveAuroraCanvas({ themeKey = "PATIENT" }) {
    const canvasRef = useRef(null);
    const themeRef = useRef(THEME_HUES.PATIENT);

    useEffect(() => {
        themeRef.current = THEME_HUES[themeKey] || THEME_HUES.PATIENT;
    }, [themeKey]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationId = 0;
        let time = 0;

        const pointer = {
            x: width * 0.5,
            y: height * 0.5,
            tx: width * 0.5,
            ty: height * 0.5,
            speed: 0,
            active: false,
        };

        const ripples = [];
        const trail = [];
        const particleCount = Math.min(48, Math.max(24, Math.floor((width * height) / 30000)));
        const particles = [];

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();

        for (let i = 0; i < particleCount; i += 1) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55,
                r: Math.random() * 2.2 + 1.1,
                hueOffset: Math.random() * 50 - 25,
            });
        }

        const handlePointerMove = (e) => {
            const dx = e.clientX - pointer.tx;
            const dy = e.clientY - pointer.ty;
            pointer.speed = Math.min(40, Math.hypot(dx, dy));
            pointer.tx = e.clientX;
            pointer.ty = e.clientY;
            pointer.active = true;

            if (pointer.speed > 4) {
                trail.push({
                    x: e.clientX,
                    y: e.clientY,
                    radius: 42 + pointer.speed * 1.4,
                    alpha: 0.24,
                    hueShift: (e.clientX / Math.max(width, 1)) * 70 + (e.clientY / Math.max(height, 1)) * 40,
                });
                if (trail.length > 18) trail.shift();
            }
        };

        const handlePointerDown = (e) => {
            ripples.push({
                x: e.clientX,
                y: e.clientY,
                radius: 12,
                maxRadius: 240,
                alpha: 0.55,
            });
        };

        const handlePointerLeave = () => {
            pointer.active = false;
        };

        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerdown", handlePointerDown, { passive: true });
        window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

        const render = () => {
            if (document.hidden) {
                animationId = requestAnimationFrame(render);
                return;
            }

            time += 0.012;
            pointer.x += (pointer.tx - pointer.x) * 0.14;
            pointer.y += (pointer.ty - pointer.y) * 0.14;
            pointer.speed *= 0.92;

            const palette = themeRef.current;
            const cursorHue =
                palette.primary +
                ((pointer.x / Math.max(width, 1)) * 55 - 25) +
                Math.sin(time) * 12;

            ctx.clearRect(0, 0, width, height);

            const orb1X = width * (0.2 + Math.sin(time * 0.6) * 0.08);
            const orb1Y = height * (0.22 + Math.cos(time * 0.5) * 0.08);
            const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, width * 0.42);
            g1.addColorStop(0, hsla(palette.primary, 88, 52, 0.22));
            g1.addColorStop(1, "transparent");
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, width, height);

            const orb2X = width * (0.82 + Math.cos(time * 0.55) * 0.08);
            const orb2Y = height * (0.76 + Math.sin(time * 0.45) * 0.08);
            const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, width * 0.45);
            g2.addColorStop(0, hsla(palette.secondary, 90, 56, 0.2));
            g2.addColorStop(1, "transparent");
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, width, height);

            for (let i = trail.length - 1; i >= 0; i -= 1) {
                const t = trail[i];
                t.radius += 2.2;
                t.alpha *= 0.92;
                if (t.alpha < 0.012) {
                    trail.splice(i, 1);
                    continue;
                }
                const tg = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius);
                tg.addColorStop(0, hsla(palette.primary + t.hueShift, 95, 60, t.alpha));
                tg.addColorStop(1, "transparent");
                ctx.fillStyle = tg;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            if (pointer.active) {
                const glowRadius = 240 + pointer.speed * 2.5;
                const cg = ctx.createRadialGradient(
                    pointer.x,
                    pointer.y,
                    0,
                    pointer.x,
                    pointer.y,
                    glowRadius
                );
                cg.addColorStop(0, hsla(cursorHue, 96, 62, 0.28));
                cg.addColorStop(0.45, hsla(palette.accent, 90, 54, 0.11));
                cg.addColorStop(1, "transparent");
                ctx.fillStyle = cg;
                ctx.beginPath();
                ctx.arc(pointer.x, pointer.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            for (let i = ripples.length - 1; i >= 0; i -= 1) {
                const r = ripples[i];
                r.radius += 6.5;
                r.alpha *= 0.94;
                if (r.radius >= r.maxRadius || r.alpha < 0.01) {
                    ripples.splice(i, 1);
                    continue;
                }
                ctx.strokeStyle = hsla(cursorHue, 95, 68, r.alpha);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            for (let i = 0; i < particles.length; i += 1) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                if (pointer.active) {
                    const dx = pointer.x - p.x;
                    const dy = pointer.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 18 && dist < 190) {
                        const pull = ((190 - dist) / 190) * 0.032;
                        p.vx += (dx / dist) * pull;
                        p.vy += (dy / dist) * pull;
                    }
                    if (dist < 165) {
                        ctx.strokeStyle = hsla(cursorHue + p.hueOffset, 95, 68, (1 - dist / 165) * 0.38);
                        ctx.lineWidth = 1.1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pointer.x, pointer.y);
                        ctx.stroke();
                    }
                }

                p.vx *= 0.992;
                p.vy *= 0.992;

                for (let j = i + 1; j < particles.length; j += 1) {
                    const q = particles[j];
                    const dist = Math.hypot(p.x - q.x, p.y - q.y);
                    if (dist < 120) {
                        ctx.strokeStyle = hsla(palette.secondary, 85, 68, (1 - dist / 120) * 0.16);
                        ctx.lineWidth = 0.85;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }

                ctx.fillStyle = hsla(cursorHue + p.hueOffset, 95, 72, 0.72);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointerleave", handlePointerLeave);
        };
    }, []);

    return <canvas ref={canvasRef} className="aurora-bg-canvas" aria-hidden="true" />;
}