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
          <filter id="glow-teal" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-celeste" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-yellow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          <linearGradient id="grad-teal-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="grad-celeste" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {/* BACKGROUND DOTTED Y-SHAPE PATHWAY (DERIVACIÓN) */}
        {/* Top-left fork to intersection */}
        <path
          d="M 108,85 Q 145,155 185,155"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />
        {/* Bottom-left fork to intersection */}
        <path
          d="M 108,225 Q 145,155 185,155"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />
        {/* Stem to right circle */}
        <path
          d="M 185,155 L 260,155"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2.5"
          strokeDasharray="6,6"
          fill="none"
        />

        {/* Glowing background flow tracks */}
        <path
          d="M 108,85 Q 145,155 185,155 L 260,155"
          stroke="url(#grad-teal-blue)"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M 108,225 Q 145,155 185,155 L 260,155"
          stroke="url(#grad-teal-blue)"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />

        {/* LEFT SIDE VERTICAL COMMUNICATION CURVES (BI-DIRECTIONAL) */}
        {/* Poli -> Vitacura */}
        <path
          d="M 65,80 L 65,230"
          stroke="rgba(20, 184, 166, 0.25)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />
        {/* Vitacura -> Poli */}
        <path
          d="M 85,230 L 85,80"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />

        {/* ANIMATED MOTIONS (LASER SPARKS / DATA PACKETS) */}
        {/* 1. Left curve: Top-to-Bottom data flow */}
        <g>
          <animateMotion dur="7s" repeatCount="indefinite" path="M 65,80 L 65,230" />
          <circle cx="0" cy="0" r="9" fill="#14b8a6" opacity="0.15" />
          <circle cx="0" cy="0" r="6" fill="#14b8a6" opacity="0.4" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* 2. Right curve: Bottom-to-Top feedback loop */}
        <g>
          <animateMotion dur="7s" repeatCount="indefinite" path="M 85,230 L 85,80" />
          <circle cx="0" cy="0" r="9" fill="#3b82f6" opacity="0.15" />
          <circle cx="0" cy="0" r="6" fill="#3b82f6" opacity="0.4" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* 3. Top Derivación flow: Poli -> Intersection */}
        <g>
          <animateMotion begin="0s" dur="10s" repeatCount="indefinite" path="M 108,85 Q 145,155 185,155" keyTimes="0;0.35;1" keyPoints="0;1;1" calcMode="linear" />
          {/* Outer glow */}
          <circle cx="0" cy="0" r="8" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0.15;0.15;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
          {/* Middle glow */}
          <circle cx="0" cy="0" r="5.5" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0.4;0.4;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
          {/* Inner core */}
          <circle cx="0" cy="0" r="3" fill="#ffffff">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
        </g>

        {/* 4. Bottom Derivación flow: Vitacura -> Intersection */}
        <g>
          <animateMotion begin="0s" dur="10s" repeatCount="indefinite" path="M 108,225 Q 145,155 185,155" keyTimes="0;0.35;1" keyPoints="0;1;1" calcMode="linear" />
          {/* Outer glow */}
          <circle cx="0" cy="0" r="8" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0.15;0.15;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
          {/* Middle glow */}
          <circle cx="0" cy="0" r="5.5" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0.4;0.4;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
          {/* Inner core */}
          <circle cx="0" cy="0" r="3" fill="#ffffff">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.35;0.36;1" />
          </circle>
        </g>

        {/* 5. Merged stem flow: Intersection -> Happy Patient */}
        <g>
          <animateMotion begin="0s" dur="10s" repeatCount="indefinite" path="M 185,155 L 260,155" keyTimes="0;0.35;0.45;1" keyPoints="0;0;1;1" calcMode="linear" />
          {/* Outer glow */}
          <circle cx="0" cy="0" r="8" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0;0;0.15;0.15;0;0" keyTimes="0;0.34;0.35;0.45;0.46;1" />
          </circle>
          {/* Middle glow */}
          <circle cx="0" cy="0" r="5.5" fill="#38bdf8">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0;0;0.4;0.4;0;0" keyTimes="0;0.34;0.35;0.45;0.46;1" />
          </circle>
          {/* Inner core */}
          <circle cx="0" cy="0" r="3" fill="#ffffff">
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.34;0.35;0.45;0.46;1" />
          </circle>
        </g>

        {/* TOP-LEFT NODE: POLICLÍNICO TABANCURA */}
        <g transform="translate(75, 75)">
          <circle r="36" fill="#0a1e19" stroke="#14b8a6" strokeWidth="2" filter="url(#glow-teal)" />
          <circle r="31" fill="#0f172a" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          {/* Policlínico Logo Image - Vector, transparent & larger! */}
          <image href="/logo.svg" x="-24" y="-24" width="48" height="48" style={{ filter: 'brightness(0) invert(1)' }} />
        </g>
        <text x="122" y="72" fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="700" textAnchor="start" letterSpacing="0.04em">
          POLICLÍNICO
        </text>
        <text x="122" y="85" fill="#14b8a6" fontSize="9" fontWeight="800" textAnchor="start" letterSpacing="0.06em">
          TABANCURA
        </text>

        {/* BOTTOM-LEFT NODE: MUNICIPALIDAD DE VITACURA */}
        <g transform="translate(75, 235)">
          <circle r="36" fill="#0a1626" stroke="#3b82f6" strokeWidth="2" filter="url(#glow-blue)" />
          <circle r="31" fill="#0f172a" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          {/* Vector Vitacura Logo - Clean, centered, transparent & larger! */}
          <g transform="translate(0, -4)">
            {/* Left leg (White) */}
            <line x1="-10" y1="-10" x2="0" y2="5" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
            {/* Right leg (White) */}
            <line x1="0" y1="5" x2="10" y2="-10" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
            {/* Center-Top Dot (White) */}
            <circle cx="0" cy="-6" r="3.2" fill="#ffffff" />
          </g>
          {/* Text "vitacura" inside the circle */}
          <text x="0" y="19" fill="#ffffff" fontSize="8.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.05em">
            vitacura
          </text>
        </g>
        <text x="28" y="232" fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="700" textAnchor="end" letterSpacing="0.04em">
          MUNICIPALIDAD
        </text>
        <text x="28" y="245" fill="#3b82f6" fontSize="9" fontWeight="800" textAnchor="end" letterSpacing="0.06em">
          DE VITACURA
        </text>

        {/* RIGHT NODE: HAPPY PATIENT / DENTAL RESULT */}
        <g transform="translate(285, 155)">

          {/* 1. SAD STATE NODE GROUP (YELLOW) - Visible 0s to 4.2s, smoothly cross-fading back at 8.5s */}
          <g>
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;0.42;0.45;0.85;1" />

            {/* Yellow Outer Rotating Gear Ring */}
            <circle r="41" fill="none" stroke="rgba(234, 179, 8, 0.25)" strokeWidth="1.5" strokeDasharray="4,6">
              <animate attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="indefinite" />
            </circle>

            {/* Solid glow container (Yellow/Amber) */}
            <circle r="36" fill="#0a141e" stroke="#eab308" strokeWidth="2" filter="url(#glow-yellow)" />
            <circle r="31" fill="#0f172a" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

            {/* Sad Face Group (Yellow) */}
            <g>
              <circle cx="0" cy="0" r="14" fill="rgba(234, 179, 8, 0.06)" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="-4.5" cy="-3" r="1.5" fill="#eab308" />
              <circle cx="4.5" cy="-3" r="1.5" fill="#eab308" />
              <path d="M -6.5,5 Q 0,0.5 6.5,5" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </g>
          </g>

          {/* 2. HAPPY STATE NODE GROUP (CELESTE) - Visible 4.5s to 8.5s, smoothly cross-fading back */}
          <g>
            <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.42;0.45;0.85;1" />

            {/* Celeste Outer Rotating Gear Ring */}
            <circle r="41" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" strokeDasharray="4,6">
              <animate attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="indefinite" />
            </circle>

            {/* Solid glow container matching upper nodes perfectly (Celeste with Impact pulse at 0.45) */}
            <circle r="36" fill="#0a1826" stroke="#38bdf8" strokeWidth="2" filter="url(#glow-celeste)">
              <animate attributeName="stroke-width" begin="0s" dur="10s" repeatCount="indefinite" values="2;2;4;2;2" keyTimes="0;0.448;0.45;0.47;1" />
              <animate attributeName="r" begin="0s" dur="10s" repeatCount="indefinite" values="36;36;38;36;36" keyTimes="0;0.448;0.45;0.47;1" />
            </circle>
            <circle r="31" fill="#0f172a" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

            {/* Happy Face Group (Celeste with Beautiful Fixed Wide Smile) */}
            <g>
              <circle cx="0" cy="0" r="14" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="-4.5" cy="-3.5" r="1.5" fill="#38bdf8" />
              <circle cx="4.5" cy="-3.5" r="1.5" fill="#38bdf8" />
              {/* Perfectly curved wide smile */}
              <path d="M -7,1 Q 0,7.5 7,1" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <circle cx="-7.5" cy="1.2" r="1" fill="#38bdf8" opacity="0.6" />
              <circle cx="7.5" cy="1.2" r="1" fill="#38bdf8" opacity="0.6" />
            </g>
          </g>
        </g>

        {/* Bottom titles - Switch dynamically at 4.5s with smooth fade */}
        {/* Waiting state titles */}
        <g>
          <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0.6;0.6;0;0;0.6" keyTimes="0;0.42;0.45;0.85;1" />
          <text x="285" y="218" fill="#eab308" fontSize="10.5" fontWeight="800" textAnchor="middle" letterSpacing="0.08em" filter="url(#glow-yellow)">
            ESPERANDO DERIVACIÓN...
          </text>
          <text x="285" y="232" fill="rgba(255, 255, 255, 0.35)" fontSize="8" fontWeight="600" textAnchor="middle" letterSpacing="0.04em">
            CONVENIO EN PROCESO DE VALIDACIÓN
          </text>
        </g>

        {/* Happy state titles */}
        <g>
          <animate attributeName="opacity" begin="0s" dur="10s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.42;0.45;0.85;1" />
          <text x="285" y="218" fill="#38bdf8" fontSize="10.5" fontWeight="800" textAnchor="middle" letterSpacing="0.08em" filter="url(#glow-celeste)">
            ¡PACIENTE FELIZ! 🦷
          </text>
          <text x="285" y="232" fill="rgba(255, 255, 255, 0.4)" fontSize="8" fontWeight="600" textAnchor="middle" letterSpacing="0.04em">
            RESULTADO DE DERIVACIÓN DENTAL
          </text>
        </g>
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
