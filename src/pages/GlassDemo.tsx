import { useEffect, useRef, useState } from 'react';
import './GlassDemo.css';

interface GlassSettings {
  shadowColor: string;
  shadowBlur: number;
  shadowSpread: number;
  tintColor: string;
  tintOpacity: number;
  frostBlur: number;
  noiseFreq: number;
  distortionStrength: number;
  backgroundUrl: string;
}

const defaultSettings: GlassSettings = {
  shadowColor: '#ffffff',
  shadowBlur: 20,
  shadowSpread: 8,
  tintColor: '#ffffff',
  tintOpacity: 0.1,
  frostBlur: 16,
  noiseFreq: 0.008,
  distortionStrength: 77,
  backgroundUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'
};

const GlassDemo = () => {
  const glassRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [settings, setSettings] = useState<GlassSettings>(defaultSettings);

  // Center the glass on mount
  useEffect(() => {
    const centerX = window.innerWidth / 2 - 200;
    const centerY = window.innerHeight / 2 - 150;
    setPosition({ x: centerX, y: centerY });
  }, []);

  // Update SVG filter when settings change
  useEffect(() => {
    if (turbulenceRef.current) {
      turbulenceRef.current.setAttribute('baseFrequency', settings.noiseFreq.toString());
    }
    if (displacementRef.current) {
      displacementRef.current.setAttribute('scale', settings.distortionStrength.toString());
    }
  }, [settings.noiseFreq, settings.distortionStrength]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.controls-panel')) return;
    setIsDragging(true);
    const rect = glassRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const tintRgb = hexToRgb(settings.tintColor);

  const glassStyle = {
    '--shadow-blur': `${settings.shadowBlur}px`,
    '--shadow-spread': `${settings.shadowSpread}px`,
    '--shadow-color': settings.shadowColor,
    '--tint-r': tintRgb.r,
    '--tint-g': tintRgb.g,
    '--tint-b': tintRgb.b,
    '--tint-opacity': settings.tintOpacity,
    '--frost-blur': `${settings.frostBlur}px`,
  } as React.CSSProperties;

  return (
    <div className="glass-page">
      {/* SVG Filter for liquid glass distortion */}
      <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glass-distortion" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency={settings.noiseFreq}
              numOctaves={2}
              seed={92}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation={2} result="blurredNoise" />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="blurredNoise"
              scale={settings.distortionStrength}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Background Image */}
      <div
        className="glass-background"
        style={{ backgroundImage: `url('${settings.backgroundUrl}')` }}
      />

      {/* Draggable Liquid Glass Element */}
      <div
        ref={glassRef}
        className={`liquid-glass ${isDragging ? 'dragging' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          ...glassStyle
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="glass-content">
          <h2>Liquid Glass</h2>
          <p>Drag me around</p>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="controls-panel liquid-glass" style={glassStyle}>
        <div className="glass-content controls-content">
          <div className="control-section">
            <h3>Inner Shadow</h3>
            <div className="control-row">
              <label>Color:</label>
              <input
                type="color"
                value={settings.shadowColor}
                onChange={(e) => setSettings({ ...settings, shadowColor: e.target.value })}
              />
            </div>
            <div className="control-row">
              <label>Blur:</label>
              <input
                type="range"
                min="0"
                max="50"
                value={settings.shadowBlur}
                onChange={(e) => setSettings({ ...settings, shadowBlur: Number(e.target.value) })}
              />
              <span>{settings.shadowBlur}px</span>
            </div>
            <div className="control-row">
              <label>Spread:</label>
              <input
                type="range"
                min="0"
                max="30"
                value={settings.shadowSpread}
                onChange={(e) => setSettings({ ...settings, shadowSpread: Number(e.target.value) })}
              />
              <span>{settings.shadowSpread}px</span>
            </div>
          </div>

          <div className="control-section">
            <h3>Glass Tint</h3>
            <div className="control-row">
              <label>Tint Color:</label>
              <input
                type="color"
                value={settings.tintColor}
                onChange={(e) => setSettings({ ...settings, tintColor: e.target.value })}
              />
            </div>
            <div className="control-row">
              <label>Opacity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.tintOpacity}
                onChange={(e) => setSettings({ ...settings, tintOpacity: Number(e.target.value) })}
              />
              <span>{Math.round(settings.tintOpacity * 100)}%</span>
            </div>
          </div>

          <div className="control-section">
            <h3>Frost Blur</h3>
            <div className="control-row">
              <label>Blur Radius:</label>
              <input
                type="range"
                min="0"
                max="50"
                value={settings.frostBlur}
                onChange={(e) => setSettings({ ...settings, frostBlur: Number(e.target.value) })}
              />
              <span>{settings.frostBlur}px</span>
            </div>
          </div>

          <div className="control-section">
            <h3>Noise Distortion</h3>
            <div className="control-row">
              <label>Noise Freq:</label>
              <input
                type="range"
                min="0.001"
                max="0.05"
                step="0.001"
                value={settings.noiseFreq}
                onChange={(e) => setSettings({ ...settings, noiseFreq: Number(e.target.value) })}
              />
              <span>{settings.noiseFreq.toFixed(3)}</span>
            </div>
            <div className="control-row">
              <label>Strength:</label>
              <input
                type="range"
                min="0"
                max="150"
                value={settings.distortionStrength}
                onChange={(e) => setSettings({ ...settings, distortionStrength: Number(e.target.value) })}
              />
              <span>{settings.distortionStrength}</span>
            </div>
          </div>

          <div className="control-section">
            <h3>Background Image</h3>
            <div className="control-row">
              <label>URL:</label>
              <input
                type="text"
                className="url-input"
                value={settings.backgroundUrl}
                onChange={(e) => setSettings({ ...settings, backgroundUrl: e.target.value })}
                placeholder="Enter image URL..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassDemo;
