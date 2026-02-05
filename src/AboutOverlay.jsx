import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function AboutOverlay() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      // Intro: apparition de toutes les cartes
      gsap.from('.about-floating .slot', {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08
      })
      // Drifts subtils
      gsap.to('.float-slow', { y: 8, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true })
      gsap.to('.float-med', { x: 10, duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true })
      gsap.to('.float-rot', { rotation: 0.5, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true, transformOrigin: '50% 50%' })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="about-floating">
      <style>{`
        .about-floating {
          position: fixed;
          inset: 0;
          pointer-events: none; /* ne bloque pas la scène */
          color: #ffffff;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          text-shadow: 0 1px 2px rgba(0,0,0,0.35);
        }
        .slot {
          position: absolute;
          max-width: min(40ch, 32vw);
          line-height: 1.25;
          pointer-events: auto; /* liens cliquables */
        }
        .h { font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.9; font-size: 14px; margin-bottom: 6px }
        .p, .li { opacity: 0.92; font-size: 14px; }
        .ul { display:grid; gap: 6px; }
        .badge { display:inline-block; margin: 2px 6px 2px 0; padding: 6px 10px; border-radius: 999px; border:1px solid rgba(255,255,255,0.16); font-size:12px; opacity:0.95 }
        .btn {
          display:inline-flex; align-items:center; gap:8px;
          margin: 4px 8px 0 0; padding: 10px 14px;
          border-radius: 12px;
          color:#fff; text-decoration:none;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border:1px solid rgba(255,255,255,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.25);
          backdrop-filter: blur(6px);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
        }
        .btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 34px rgba(0,0,0,0.35);
          border-color: rgba(255,255,255,0.28);
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
        }
        .btn:active { transform: translateY(0) scale(0.99) }
        .btn svg { width: 14px; height: 14px; opacity: 0.9 }

        /* Placement responsive */
        .slot-value { top: clamp(12px, 6vh, 48px); left: clamp(12px, 5vw, 56px); }
        .slot-roles { top: clamp(12px, 6vh, 48px); right: clamp(12px, 5vw, 56px); text-align: right }
        .slot-skills { right: clamp(12px, 5vw, 56px); top: 45%; transform: translateY(-50%); text-align:right }
        .slot-persona { left: clamp(12px, 5vw, 56px); top: 45%; transform: translateY(-50%); }
        .slot-timeline { left: clamp(12px, 5vw, 56px); bottom: clamp(12px, 5vh, 48px); }
        .slot-cta { right: clamp(12px, 5vw, 56px); bottom: clamp(12px, 5vh, 48px); text-align:right }
        .slot-langs { left: 50%; transform: translateX(-50%); bottom: 12px; text-align:center; }

        .timeline { display:grid; gap: 6px; opacity:0.95 }
      `}</style>

      {/* Proposition de valeur */}
      <div className="slot slot-value float-slow">
        <div className="p">I’m a 24 y/o 2D/3D Motion Designer with a web‑development backbone, crafting playful, interactive motion that turns complex ideas into clear stories.</div>
      </div>

      {/* Rôle & spécialités */}
      <div className="slot slot-roles float-med">
        <div className="ul">
          <div className="li">2D/3D Motion Designer</div>
        </div>
      </div>


      {/* CTA */}
      <div className="slot slot-cta float-rot">
        <a className="btn" href="mailto:keomonivong.chou@gmail.com">Contact me</a>
        <a className="btn" href="/CV.pdf" download>My resume</a>
      </div>
    </div>
  )
}

