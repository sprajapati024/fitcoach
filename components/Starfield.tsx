"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  baseOpacity: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    // Initialize stars
    const createStars = () => {
      const stars: Star[] = [];
      const starCount = Math.min(200, Math.floor((window.innerWidth * window.innerHeight) / 8000));

      for (let i = 0; i < starCount; i++) {
        const baseOpacity = Math.random() * 0.5 + 0.3; // 0.3 to 0.8
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 2 + 0.5, // 0.5 to 2.5
          opacity: baseOpacity,
          twinkleSpeed: Math.random() * 0.02 + 0.01, // 0.01 to 0.03
          twinkleOffset: Math.random() * Math.PI * 2,
          baseOpacity,
        });
      }
      starsRef.current = stars;
    };

    setCanvasSize();
    createStars();

    // Mouse move handler for parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    // Animation loop
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const mouseX = mouseRef.current.x || centerX;
      const mouseY = mouseRef.current.y || centerY;

      starsRef.current.forEach((star) => {
        // Calculate parallax offset (very subtle)
        const parallaxStrength = star.size * 0.5;
        const offsetX = ((mouseX - centerX) / centerX) * parallaxStrength;
        const offsetY = ((mouseY - centerY) / centerY) * parallaxStrength;

        // Twinkle effect using sine wave
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
        star.opacity = star.baseOpacity + twinkle * 0.3;

        // Draw star
        ctx.beginPath();
        ctx.arc(
          star.x + offsetX,
          star.y + offsetY,
          star.size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.opacity))})`;
        ctx.fill();

        // Add glow for larger stars
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(
            star.x + offsetX,
            star.y + offsetY,
            star.size * 2,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.1})`;
          ctx.fill();
        }
      });

      frame++;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", () => {
      setCanvasSize();
      createStars();
    });

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", setCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ willChange: "transform" }}
    />
  );
}
