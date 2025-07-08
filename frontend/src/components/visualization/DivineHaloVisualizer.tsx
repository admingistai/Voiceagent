import React, { useEffect, useRef, useState } from 'react';

interface DivineHaloVisualizerProps {
  frequencyData: Float32Array[] | null;
  state: string;
  sensitivity?: number;
  visualizationMode?: 'divine' | 'particles' | 'wave';
  faceImage?: string | null;
}

// Visualization Mode Classes
class DivineMode {
  private halo = {
    baseRadius: 100,
    rings: [
      { radius: 100, alpha: 1, speed: 1 },
      { radius: 120, alpha: 0.7, speed: 0.9 },
      { radius: 140, alpha: 0.5, speed: 0.8 },
      { radius: 160, alpha: 0.3, speed: 0.7 },
      { radius: 180, alpha: 0.2, speed: 0.6 }
    ],
    glowIntensity: 0,
    targetGlowIntensity: 0,
    expansionFactor: 0,
    pulsePhase: 0
  };

  update(audioData: { smoothAmplitude: number; speaking: boolean }) {
    const normalizedAmp = this.calculateNormalizedAmplitude(audioData.smoothAmplitude);
    const expansionCurve = this.applyExpansionCurve(normalizedAmp);
    this.halo.expansionFactor = expansionCurve;
    
    const glowCurve = Math.pow(normalizedAmp, 0.7);
    this.halo.targetGlowIntensity = 0.1 + (glowCurve * 0.9);
    this.halo.glowIntensity += (this.halo.targetGlowIntensity - this.halo.glowIntensity) * 0.15;
    
    this.halo.rings.forEach((ring, i) => {
      const baseRadius = 100 + i * 20;
      const ringFactor = 1 - (i * 0.15);
      const maxExpansion = 150;
      ring.radius = baseRadius + (this.halo.expansionFactor * maxExpansion * ring.speed * ringFactor);
    });
    
    if (!audioData.speaking) {
      this.halo.pulsePhase += 0.01;
    }
  }

  resize(width: number, height: number) {
    // DivineMode doesn't need resize logic
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, speaking: boolean) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 80 + this.halo.expansionFactor * 50
    );
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.2, 'rgba(230, 230, 250, 0.9)');
    coreGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.6)');
    coreGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80 + this.halo.expansionFactor * 50, 0, Math.PI * 2);
    ctx.fill();
    
    this.halo.rings.forEach((ring) => {
      const alpha = ring.alpha * (0.5 + this.halo.glowIntensity * 0.5);
      const thickness = 20 + this.halo.glowIntensity * 10;
      
      const ringGradient = ctx.createRadialGradient(
        centerX, centerY, ring.radius - thickness,
        centerX, centerY, ring.radius + thickness
      );
      
      ringGradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
      ringGradient.addColorStop(0.3, `rgba(138, 43, 226, ${alpha * 0.5})`);
      ringGradient.addColorStop(0.5, `rgba(186, 85, 211, ${alpha})`);
      ringGradient.addColorStop(0.7, `rgba(138, 43, 226, ${alpha * 0.5})`);
      ringGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
      
      ctx.fillStyle = ringGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring.radius + thickness, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, Math.max(0, ring.radius - thickness), 0, Math.PI * 2, true);
      ctx.fill();
    });
    
    if (speaking && this.halo.glowIntensity > 0.3) {
      ctx.globalCompositeOperation = 'screen';
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 * i) / rayCount + this.halo.pulsePhase;
        const rayLength = 200 + this.halo.expansionFactor * 150;
        
        const rayGradient = ctx.createLinearGradient(
          centerX, centerY,
          centerX + Math.cos(angle) * rayLength,
          centerY + Math.sin(angle) * rayLength
        );
        
        rayGradient.addColorStop(0, `rgba(186, 85, 211, ${this.halo.glowIntensity * 0.3})`);
        rayGradient.addColorStop(0.5, `rgba(138, 43, 226, ${this.halo.glowIntensity * 0.1})`);
        rayGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        
        ctx.strokeStyle = rayGradient;
        ctx.lineWidth = 5 + this.halo.glowIntensity * 10;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * rayLength,
          centerY + Math.sin(angle) * rayLength
        );
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.restore();
  }

  private calculateNormalizedAmplitude(amplitude: number): number {
    const noiseFloor = 0.001;    // Lower threshold for normalized data
    const normalSpeech = 0.01;   // Adjusted for normalized values
    const loudSpeech = 0.03;     // Adjusted for normalized values
    const maxThreshold = 0.05;   // Adjusted for normalized values
    
    let normalized;
    if (amplitude < normalSpeech) {
      normalized = (amplitude / normalSpeech) * 0.3;
    } else if (amplitude < loudSpeech) {
      const range = loudSpeech - normalSpeech;
      const position = (amplitude - normalSpeech) / range;
      normalized = 0.3 + (position * 0.4);
    } else {
      const range = maxThreshold - loudSpeech;
      const position = Math.min(1, (amplitude - loudSpeech) / range);
      normalized = 0.7 + (position * 0.3);
    }
    
    return Math.min(1, normalized);
  }

  private applyExpansionCurve(normalized: number): number {
    const x = normalized;
    return x * x * (3.0 - 2.0 * x);
  }
}

class ParticleMode {
  private particles: Array<{
    angle: number;
    baseRadius: number;
    currentRadius: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    hue: number;
  }> = [];
  private particleCount = 200;
  private baseRadius = 150;
  private waveCount = 3;
  private waveAmplitude = 30;
  private waveSpeed = 0.02;
  private time = 0;

  constructor() {
    this.initializeParticles();
  }

  private initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / this.particleCount;
      this.particles.push({
        angle: angle,
        baseRadius: this.baseRadius,
        currentRadius: this.baseRadius,
        x: 0,
        y: 0,
        size: 4,
        opacity: 1,
        hue: 280 + (i / this.particleCount) * 40
      });
    }
  }

  update(audioData: { smoothAmplitude: number }) {
    this.time += this.waveSpeed;
    const normalizedAmp = this.calculateNormalizedAmplitude(audioData.smoothAmplitude);
    const expansionCurve = this.applyExpansionCurve(normalizedAmp);
    const audioScale = 1 + expansionCurve * 2;
    
    this.particles.forEach((particle) => {
      const waveOffset = Math.sin(particle.angle * this.waveCount + this.time) * this.waveAmplitude;
      const secondaryWave = Math.sin(particle.angle * (this.waveCount * 2) - this.time * 0.7) * (this.waveAmplitude * 0.3);
      const totalOffset = (waveOffset + secondaryWave) * audioScale;
      
      particle.currentRadius = particle.baseRadius + totalOffset;
      particle.opacity = 0.6 + Math.sin(particle.angle * this.waveCount + this.time) * 0.4;
      particle.size = 3 + Math.abs(totalOffset / this.waveAmplitude) * 2;
    });
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    ctx.globalCompositeOperation = 'screen';
    this.particles.forEach(particle => {
      particle.x = centerX + Math.cos(particle.angle) * particle.currentRadius;
      particle.y = centerY + Math.sin(particle.angle) * particle.currentRadius;
      
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      
      gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity * 0.3})`);
      gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 50%, ${particle.opacity * 0.2})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalCompositeOperation = 'lighter';
    this.particles.forEach(particle => {
      ctx.fillStyle = `hsla(${particle.hue}, 100%, 70%, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  resize(width: number, height: number) {
    this.initializeParticles();
  }

  private calculateNormalizedAmplitude(amplitude: number): number {
    const normalSpeech = 0.01;   // Adjusted for normalized values
    const loudSpeech = 0.03;     // Adjusted for normalized values
    const maxThreshold = 0.05;   // Adjusted for normalized values
    
    let normalized;
    if (amplitude < normalSpeech) {
      normalized = (amplitude / normalSpeech) * 0.3;
    } else if (amplitude < loudSpeech) {
      const range = loudSpeech - normalSpeech;
      const position = (amplitude - normalSpeech) / range;
      normalized = 0.3 + (position * 0.4);
    } else {
      const range = maxThreshold - loudSpeech;
      const position = Math.min(1, (amplitude - loudSpeech) / range);
      normalized = 0.7 + (position * 0.3);
    }
    
    return Math.min(1, normalized);
  }

  private applyExpansionCurve(normalized: number): number {
    const x = normalized;
    return x * x * (3.0 - 2.0 * x);
  }
}

class WaveMode {
  private waveData: number[] = [];
  private waveLength = 200;
  private waveSpeed = 0.05;
  private wavePhase = 0;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }> = [];

  constructor() {
    this.initializeWaveParticles();
  }

  private initializeWaveParticles() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.5
      });
    }
  }

  update(audioData: { smoothAmplitude: number }) {
    this.wavePhase += this.waveSpeed;
    
    this.waveData.push(audioData.smoothAmplitude);
    if (this.waveData.length > this.waveLength) {
      this.waveData.shift();
    }
    
    this.particles.forEach(particle => {
      particle.x += particle.vx + audioData.smoothAmplitude * 50;
      particle.y += particle.vy + Math.sin(this.wavePhase + particle.x * 0.01) * 2;
      
      if (particle.x > window.innerWidth) particle.x = 0;
      if (particle.x < 0) particle.x = window.innerWidth;
      if (particle.y > window.innerHeight) particle.y = 0;
      if (particle.y < 0) particle.y = window.innerHeight;
      
      particle.size = 1 + audioData.smoothAmplitude * 100;
    });
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.save();
    ctx.strokeStyle = '#8B2BE2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < this.waveData.length; i++) {
      const x = (i / this.waveData.length) * canvas.width;
      const y = centerY + this.waveData[i] * 1000 * Math.sin(this.wavePhase + i * 0.1);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.strokeStyle = '#BA55D3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const amplitude = this.waveData[Math.floor((angle / (Math.PI * 2)) * this.waveData.length)] || 0;
      const radius = 100 + amplitude * 500 + Math.sin(this.wavePhase + angle * 5) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    this.particles.forEach(particle => {
      ctx.fillStyle = `rgba(138, 43, 226, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  resize(width: number, height: number) {
    this.initializeWaveParticles();
  }
}

const DivineHaloVisualizer: React.FC<DivineHaloVisualizerProps> = ({
  frequencyData,
  state,
  sensitivity = 1.0,
  visualizationMode = 'divine',
  faceImage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const audioContextRef = useRef<{ amplitude: number; smoothAmplitude: number; speaking: boolean }>({
    amplitude: 0,
    smoothAmplitude: 0,
    speaking: false
  });
  const visualizationRef = useRef<{ divine: DivineMode; particles: ParticleMode; wave: WaveMode }>({
    divine: new DivineMode(),
    particles: new ParticleMode(),
    wave: new WaveMode()
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      Object.values(visualizationRef.current).forEach(mode => {
        if (mode.resize) mode.resize(canvas.width, canvas.height);
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      if (!frequencyData || frequencyData.length === 0) {
        audioContextRef.current.amplitude = 0;
      } else {
        // Calculate RMS amplitude from frequency data (already normalized 0-1)
        let sum = 0;
        let count = 0;
        frequencyData.forEach(band => {
          band.forEach(value => {
            sum += value * value;
            count++;
          });
        });
        audioContextRef.current.amplitude = Math.sqrt(sum / count);
        
        // Debug logging - remove after testing
        if (count > 0 && audioContextRef.current.amplitude > 0) {
          console.log('Audio amplitude:', audioContextRef.current.amplitude, 'Sensitivity:', sensitivity);
        }
      }

      // Apply sensitivity
      audioContextRef.current.amplitude *= sensitivity;

      // Smooth amplitude
      const targetAmplitude = audioContextRef.current.amplitude;
      const speed = targetAmplitude > audioContextRef.current.smoothAmplitude ? 0.2 : 0.08;
      audioContextRef.current.smoothAmplitude += 
        (targetAmplitude - audioContextRef.current.smoothAmplitude) * speed;

      // Detect speaking (adjusted threshold for normalized data)
      audioContextRef.current.speaking = audioContextRef.current.smoothAmplitude > 0.001;

      // Update and draw current visualization
      const currentMode = visualizationRef.current[visualizationMode];
      currentMode.update(audioContextRef.current);
      currentMode.draw(ctx, canvas, audioContextRef.current.speaking);

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [frequencyData, sensitivity, visualizationMode]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0a0a0a' }}
      />
      {faceImage && (
        <img
          src={faceImage}
          alt="Face overlay"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 object-cover rounded-full pointer-events-none"
          style={{ zIndex: 5 }}
        />
      )}
    </div>
  );
};

export default DivineHaloVisualizer;