import { useEffect, useRef } from "react";

export default function Spatial3DCard({
                                          children,
                                          className = "",
                                          maxTilt = 10,
                                          glareOpacity = 0.28,
                                      }) {
    const cardRef = useRef(null);
    const glareRef = useRef(null);
    const stateRef = useRef({
        rx: 0,
        ry: 0,
        trx: 0,
        try: 0,
        scale: 1,
        tScale: 1,
        gx: 50,
        gy: 50,
        opacity: 0,
        tOpacity: 0,
        hue: 175,
        rafId: 0,
    });

    useEffect(() => {
        const s = stateRef.current;
        return () => {
            if (s.rafId) cancelAnimationFrame(s.rafId);
        };
    }, []);

    const scheduleFrame = () => {
        const s = stateRef.current;
        if (s.rafId) return;

        const tick = () => {
            s.rx += (s.trx - s.rx) * 0.16;
            s.ry += (s.try - s.ry) * 0.16;
            s.scale += (s.tScale - s.scale) * 0.16;
            s.opacity += (s.tOpacity - s.opacity) * 0.16;

            const card = cardRef.current;
            const glare = glareRef.current;

            if (card) {
                card.style.transform = `perspective(1200px) rotateX(${s.rx.toFixed(
                    2
                )}deg) rotateY(${s.ry.toFixed(2)}deg) scale3d(${s.scale.toFixed(3)}, ${s.scale.toFixed(
                    3
                )}, 1)`;
                card.style.setProperty("--mx", `${s.gx.toFixed(1)}%`);
                card.style.setProperty("--my", `${s.gy.toFixed(1)}%`);
                card.style.setProperty("--hue", `${s.hue.toFixed(0)}`);
            }

            if (glare) {
                glare.style.opacity = s.opacity.toFixed(3);
                glare.style.background = `radial-gradient(circle 340px at ${s.gx.toFixed(
                    1
                )}% ${s.gy.toFixed(1)}%, hsla(${s.hue.toFixed(
                    0
                )}, 95%, 72%, 0.42), rgba(255,255,255,0.22) 34%, transparent 70%)`;
            }

            const settled =
                Math.abs(s.trx - s.rx) < 0.02 &&
                Math.abs(s.try - s.ry) < 0.02 &&
                Math.abs(s.tScale - s.scale) < 0.001 &&
                Math.abs(s.tOpacity - s.opacity) < 0.005;

            if (settled) {
                s.rafId = 0;
            } else {
                s.rafId = requestAnimationFrame(tick);
            }
        };

        s.rafId = requestAnimationFrame(tick);
    };

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const s = stateRef.current;
        s.try = (px - 0.5) * (maxTilt * 2);
        s.trx = (0.5 - py) * (maxTilt * 2);
        s.tScale = 1.015;
        s.gx = px * 100;
        s.gy = py * 100;
        s.hue = 165 + px * 115 + py * 35;
        s.tOpacity = glareOpacity;
        scheduleFrame();
    };

    const handleMouseLeave = () => {
        const s = stateRef.current;
        s.trx = 0;
        s.try = 0;
        s.tScale = 1;
        s.tOpacity = 0;
        scheduleFrame();
    };

    return (
        <div
            ref={cardRef}
            className={`spatial-card-shell ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div ref={glareRef} className="spatial-glare" />
            {children}
        </div>
    );
}