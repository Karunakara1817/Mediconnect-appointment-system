import { useEffect, useRef } from "react";
import {
    Activity,
    BellRing,
    CalendarCheck2,
    HeartPulse,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";

export default function Medical3DPrism() {
    const cubeRef = useRef(null);
    const physicsRef = useRef({
        rx: -18,
        ry: 28,
        vx: 0,
        vy: 0.45,
        dragging: false,
        lastX: 0,
        lastY: 0,
    });

    useEffect(() => {
        let frameId = 0;
        const animate = () => {
            if (!document.hidden) {
                const p = physicsRef.current;
                if (!p.dragging) {
                    p.rx += p.vx;
                    p.ry += p.vy;
                    p.vx *= 0.94;
                    p.vy = p.vy * 0.96 + 0.42 * 0.04;
                    p.rx = Math.max(-75, Math.min(75, p.rx));
                }

                if (cubeRef.current) {
                    cubeRef.current.style.transform = `rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(
                        2
                    )}deg)`;
                }
            }
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, []);

    const handlePointerDown = (e) => {
        const p = physicsRef.current;
        p.dragging = true;
        p.lastX = e.clientX;
        p.lastY = e.clientY;
        p.vx = 0;
        p.vy = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        const p = physicsRef.current;
        if (!p.dragging) return;
        const dx = e.clientX - p.lastX;
        const dy = e.clientY - p.lastY;
        p.lastX = e.clientX;
        p.lastY = e.clientY;

        p.vy = dx * 0.55;
        p.vx = -dy * 0.55;
        p.rx = Math.max(-75, Math.min(75, p.rx + p.vx));
        p.ry += p.vy;
    };

    const handlePointerUp = () => {
        physicsRef.current.dragging = false;
    };

    const handleDoubleClick = () => {
        physicsRef.current.vy = 14;
        physicsRef.current.vx = 5;
    };

    return (
        <div className="prism-stage-wrap">
            <div
                className="prism-stage"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDoubleClick}
                title="Drag or double-click to spin"
            >
                <div ref={cubeRef} className="prism-cube">
                    <div className="prism-face face-front">
                        <HeartPulse size={34} />
                        <span>Care</span>
                    </div>
                    <div className="prism-face face-back">
                        <Stethoscope size={34} />
                        <span>Doctors</span>
                    </div>
                    <div className="prism-face face-right">
                        <CalendarCheck2 size={34} />
                        <span>Slots</span>
                    </div>
                    <div className="prism-face face-left">
                        <ShieldCheck size={34} />
                        <span>JWT</span>
                    </div>
                    <div className="prism-face face-top">
                        <BellRing size={30} />
                    </div>
                    <div className="prism-face face-bottom">
                        <Activity size={30} />
                    </div>
                </div>
                <div className="prism-floor-shadow" />
            </div>
            <span className="prism-caption">Drag or double-click 3D core</span>
        </div>
    );
}