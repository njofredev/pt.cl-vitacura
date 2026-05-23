'use client';

import React from 'react';

export default function ShowcaseInteractive() {
  return (
    <div className="showcase-container animate-fade-in">
      {/* Background soft glowing lights */}
      <div className="glowing-orb orb-1"></div>
      <div className="glowing-orb orb-2"></div>

      {/* Hand-drawn Diagram Animated with High Fidelity SVGs - Clean, enlarged and natively integrated */}
      <svg 
        width="100%" 
        height="450" 
        viewBox="0 0 400 330" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ overflow: 'visible', zIndex: 5 }}
      >
        <defs>
          {/* Glow Filters for Premium Neon Highlight */}
          <filter id="glow-teal" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          <linearGradient id="grad-teal-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* BACKGROUND DOTTED Y-SHAPE PATHWAY (DERIVACIÓN) */}
        {/* Left fork to intersection */}
        <path
          d="M 90,80 Q 145,145 200,170"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />
        {/* Right fork to intersection */}
        <path
          d="M 310,80 Q 255,145 200,170"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />
        {/* Stem to bottom circle */}
        <path
          d="M 200,170 L 200,232"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />

        {/* Glowing background flow tracks */}
        <path
          d="M 90,80 Q 145,145 200,170 L 200,232"
          stroke="url(#grad-teal-blue)"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M 310,80 Q 255,145 200,170 L 200,232"
          stroke="url(#grad-teal-blue)"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />

        {/* UPPER COMMUNICATION CURVES (BI-DIRECTIONAL) */}
        {/* Poli -> Vitacura */}
        <path
          d="M 90,65 Q 200,25 310,65"
          stroke="rgba(20, 184, 166, 0.25)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />
        {/* Vitacura -> Poli */}
        <path
          d="M 310,75 Q 200,115 90,75"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />

        {/* ANIMATED MOTIONS (LASER SPARKS / DATA PACKETS) */}
        {/* 1. Upper curve: Left-to-Right data flow */}
        <g>
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M 90,65 Q 200,25 310,65" />
          <circle cx="0" cy="0" r="9" fill="#14b8a6" opacity="0.15" />
          <circle cx="0" cy="0" r="6" fill="#14b8a6" opacity="0.4" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* 2. Lower curve: Right-to-Left feedback loop */}
        <g>
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M 310,75 Q 200,115 90,75" />
          <circle cx="0" cy="0" r="9" fill="#3b82f6" opacity="0.15" />
          <circle cx="0" cy="0" r="6" fill="#3b82f6" opacity="0.4" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* 3. Left Derivación flow: Poli -> Intersection -> Happy Patient */}
        <g>
          <animateMotion dur="4.5s" repeatCount="indefinite" begin="0s" path="M 90,80 Q 145,145 200,170 L 200,232" />
          <circle cx="0" cy="0" r="8" fill="#10b981" opacity="0.15" />
          <circle cx="0" cy="0" r="5.5" fill="#10b981" opacity="0.4" />
          <circle cx="0" cy="0" r="3" fill="#ffffff" />
        </g>

        {/* 4. Right Derivación flow: Vitacura -> Intersection -> Happy Patient */}
        <g>
          <animateMotion dur="4.5s" repeatCount="indefinite" begin="2.25s" path="M 310,80 Q 255,145 200,170 L 200,232" />
          <circle cx="0" cy="0" r="8" fill="#3b82f6" opacity="0.15" />
          <circle cx="0" cy="0" r="5.5" fill="#3b82f6" opacity="0.4" />
          <circle cx="0" cy="0" r="3" fill="#ffffff" />
        </g>

        {/* LEFT NODE: POLICLÍNICO TABANCURA */}
        <g transform="translate(90, 70)">
          <circle r="36" fill="rgba(10, 30, 25, 0.85)" stroke="#14b8a6" strokeWidth="2" filter="url(#glow-teal)" />
          <circle r="31" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          {/* Policlínico Logo Image - Vector, transparent & larger! */}
          <image href="/logo.svg" x="-24" y="-24" width="48" height="48" />
        </g>
        <text x="90" y="124" fill="rgba(255,255,255,0.75)" fontSize="10.5" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
          POLICLÍNICO
        </text>
        <text x="90" y="137" fill="#14b8a6" fontSize="9.5" fontWeight="800" textAnchor="middle" letterSpacing="0.06em">
          TABANCURA
        </text>

        {/* RIGHT NODE: MUNICIPALIDAD DE VITACURA */}
        <g transform="translate(310, 70)">
          <circle r="36" fill="rgba(10, 22, 38, 0.85)" stroke="#3b82f6" strokeWidth="2" filter="url(#glow-blue)" />
          <circle r="31" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          {/* Vector Vitacura Logo - Clean, centered, transparent & larger! */}
          <g transform="translate(0, -4)">
            {/* Left leg (Cyan) */}
            <line x1="-10" y1="-10" x2="0" y2="5" stroke="#0ea5e9" strokeWidth="5.5" strokeLinecap="round" />
            {/* Right leg (Green) */}
            <line x1="0" y1="5" x2="10" y2="-10" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
            {/* Magenta Center-Top Dot */}
            <circle cx="0" cy="-6" r="3.2" fill="#f43f5e" />
          </g>
          {/* Text "vitacura" inside the circle */}
          <text x="0" y="19" fill="#ffffff" fontSize="8.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.05em">
            vitacura
          </text>
        </g>

        {/* BOTTOM NODE: HAPPY PATIENT / DENTAL RESULT */}
        <g transform="translate(200, 252)">
          {/* Golden Outer Rotating Gear Ring */}
          <circle r="44" fill="none" stroke="rgba(251, 191, 36, 0.18)" strokeWidth="1.5" strokeDasharray="4,6">
            <animate attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="indefinite" />
          </circle>
          {/* Solid glow container */}
          <circle r="36" fill="rgba(28, 22, 10, 0.9)" stroke="url(#grad-gold)" strokeWidth="2.5" filter="url(#glow-gold)" />
          <circle r="30" fill="rgba(15, 23, 42, 0.96)" />

          {/* FADING ICON CYCLING SYSTEM (TOOTH <-> HAPPY FACE) */}
          {/* Icon A: Happy Face (Smile) */}
          <g className="icon-smile">
            <circle cx="0" cy="0" r="13" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="-4" cy="-2.5" r="1.5" fill="#fbbf24" />
            <circle cx="4" cy="-2.5" r="1.5" fill="#fbbf24" />
            <path d="M -6,2.5 Q 0,8.5 6,2.5" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="-6" cy="2.5" r="1" fill="#f59e0b" />
            <circle cx="6" cy="2.5" r="1" fill="#f59e0b" />
          </g>

          {/* Icon B: Dental Logo Image - Beautiful Vector Tooth! */}
          <g className="icon-tooth">
            <circle cx="0" cy="0" r="13" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Custom Vector Tooth Shape */}
            <path d="M 0,-4 
                     C -2,-7 -7,-7 -8,-3 
                     C -9,1 -7,5 -4,8 
                     C -3.3,9 -2.3,9 -2.3,7.5 
                     C -2.3,5.3 -3,3.5 -1.2,2.8 
                     C -0.3,2.5 0.3,2.5 1.2,2.8 
                     C 3,3.5 2.3,5.3 2.3,7.5 
                     C 2.3,9 3.3,9 4,8 
                     C 7,5 9,1 8,-3 
                     C 7,-7 2,-7 0,-4 Z" 
                  fill="#fbbf24" 
                  stroke="#fbbf24" 
                  strokeWidth="0.8" 
                  strokeLinejoin="round" />
          </g>
        </g>

        {/* Bottom titles */}
        <text x="200" y="312" fill="#fbbf24" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="0.08em" filter="url(#glow-gold)">
          ¡PACIENTE FELIZ! 😊
        </text>
        <text x="200" y="324" fill="rgba(255,255,255,0.4)" fontSize="8.5" fontWeight="600" textAnchor="middle" letterSpacing="0.04em">
          RESULTADO DE DERIVACIÓN DENTAL
        </text>
      </svg>

      <style jsx global>{`
        /* Showcase Container - Enlarged & Integrated natively */
        .showcase-container {
          position: relative;
          width: 100%;
          max-width: 660px;
          height: 480px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          z-index: 5;
        }

        /* Glowing back orbs for premium high-end aesthetics */
        .glowing-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 1;
        }

        .orb-1 {
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, transparent 70%);
          top: 15%;
          right: 15%;
          animation: orb-pulse 8s ease-in-out infinite;
        }

        .orb-2 {
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
          bottom: 15%;
          left: 15%;
          animation: orb-pulse 6s ease-in-out infinite alternate;
        }

        @keyframes orb-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* FADING ICON CYCLING ANIMATIONS */
        @keyframes crossfade-tooth {
          0%, 45% { opacity: 1; transform: scale(1) rotate(0deg); }
          50%, 95% { opacity: 0; transform: scale(0.7) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes crossfade-smile {
          0%, 45% { opacity: 0; transform: scale(0.7); }
          50%, 95% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(0.7); }
        }

        .icon-tooth {
          animation: crossfade-tooth 6s infinite ease-in-out;
          transform-origin: 0px 0px;
        }

        .icon-smile {
          animation: crossfade-smile 6s infinite ease-in-out;
          transform-origin: 0px 0px;
        }

        /* Showcase Responsiveness */
        @media (max-width: 1024px) {
          .showcase-container {
            transform: scale(0.85);
            margin: 0 auto;
            height: 360px;
          }
        }

        @media (max-width: 640px) {
          .showcase-container {
            display: none; /* Hidden on mobile viewports */
          }
        }
      `}</style>
    </div>
  );
}
