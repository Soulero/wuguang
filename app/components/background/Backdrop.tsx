"use client";

import { useRef, useEffect, useState } from "react";

export function Backdrop() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-mist" />
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none" />
      <div className="bg-grain" />
      
      <div
        className="glow-orb"
        style={{
          width: 400,
          height: 400,
          left: "15%",
          top: "20%",
        }}
      />
      <div
        className="glow-orb"
        style={{
          width: 300,
          height: 300,
          right: "10%",
          top: "60%",
          animationDelay: "-7s",
        }}
      />
      <div
        className="glow-orb"
        style={{
          width: 350,
          height: 350,
          left: "60%",
          top: "10%",
          animationDelay: "-13s",
        }}
      />

      {!prefersReducedMotion.current && (
        <div
          className="mouse-glow"
          style={{
            left: mousePos.x,
            top: mousePos.y,
          }}
        />
      )}
    </>
  );
}
