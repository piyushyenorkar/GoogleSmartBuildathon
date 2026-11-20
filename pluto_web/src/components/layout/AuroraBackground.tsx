import { useEffect, useRef } from 'react';
import './AuroraBackground.css';

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // Initialize Starfield
    let stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];
    const initStars = () => {
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.015
        });
      }
    };
    initStars();

    let time = 0;

    const draw = () => {
      // 1. Draw Deep Space Background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020205';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Twinkling Stars
      stars.forEach(star => {
        star.phase += star.speed;
        const alpha = 0.2 + Math.abs(Math.sin(star.phase)) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Aurora Curtains
      ctx.globalCompositeOperation = 'screen';

      const curtains = [
        { color: [16, 185, 129], yOffset: -80, amplitude: 140, waveSpeed: 0.4 },  // Emerald Green
        { color: [139, 92, 246], yOffset: 40, amplitude: 160, waveSpeed: 0.3 },   // Deep Purple
        { color: [236, 72, 153], yOffset: 120, amplitude: 120, waveSpeed: 0.5 },  // Vibrant Pink
        { color: [56, 189, 248], yOffset: -20, amplitude: 100, waveSpeed: 0.6 }   // Sky Blue
      ];

      const step = 4; // Width of each vertical ray

      curtains.forEach((c, index) => {
        for (let x = 0; x < width; x += step) {
          // Macro-wave: The large sweeping curve of the curtain
          const wave1 = Math.sin(x * 0.0015 + time * c.waveSpeed);
          const wave2 = Math.sin(x * 0.003 - time * c.waveSpeed * 0.8);
          const y = height * 0.4 + c.yOffset + (wave1 * c.amplitude) + (wave2 * c.amplitude * 0.5);

          // Micro-wave: The sharp, distinct vertical folds and rays
          const fold1 = Math.sin(x * 0.008 + time * 1.5 + index);
          const fold2 = Math.sin(x * 0.02 - time * 2);
          const fold = fold1 * fold2;

          // Using power function to make rays extremely sharp and distinct
          const intensity = Math.pow(Math.abs(fold), 1.5);
          const alpha = (intensity * 0.35) + 0.02; // Peak opacity 0.37, base glow 0.02

          // Height of the rays varies slightly across the screen
          const h = height * 0.7 + Math.sin(x * 0.004) * height * 0.2;

          // Dome Perspective: Rays lean towards the center
          const fanX = (x - width / 2) * 0.15;

          ctx.beginPath();
          // Top of the ray
          ctx.moveTo(x - fanX, y - h / 2);
          // Bottom of the ray
          ctx.lineTo(x + fanX, y + h / 2);

          ctx.strokeStyle = `rgba(${c.color[0]}, ${c.color[1]}, ${c.color[2]}, ${alpha})`;
          ctx.lineWidth = step * 1.2; // Slight overlap for blending
          ctx.stroke();
        }
      });

      // 4. Atmospheric Fade (Vignette)
      // Fades the top and bottom so the rays don't hard-cut at the screen edges
      ctx.globalCompositeOperation = 'source-over';

      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.35);
      topGradient.addColorStop(0, '#020205'); // Solid sky
      topGradient.addColorStop(1, 'rgba(2, 2, 5, 0)');
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.35);

      const bottomGradient = ctx.createLinearGradient(0, height * 0.65, 0, height);
      bottomGradient.addColorStop(0, 'rgba(2, 2, 5, 0)');
      bottomGradient.addColorStop(1, '#020205'); // Solid sky
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      time += 0.015;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="aurora-canvas" />;
}
