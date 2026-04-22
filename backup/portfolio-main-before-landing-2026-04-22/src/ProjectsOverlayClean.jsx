import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ProjectsOverlayClean() {
  const rootRef = useRef(null)
  const lastFsVideoRef = useRef(null)
  const fsIntentRef = useRef(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const spotlight = root.querySelector('.spotlight')
      const projectIndexEl = root.querySelector('.project-index h1')
      const projectImagesContainer = root.querySelector('.project-images')
      const projectImgs = Array.from(root.querySelectorAll('.project-img'))
      const projectNames = Array.from(root.querySelectorAll('.project-names p'))
      const projectNamesContainer = root.querySelector('.project-names')
      const total = projectNames.length

      const recompute = () => {
        const sectionH = spotlight.clientHeight
        const pad = parseFloat(getComputedStyle(spotlight).padding) || 0
        const indexH = projectIndexEl?.clientHeight || 0
        const namesH = projectNamesContainer?.clientHeight || 0
        const imagesH = projectImagesContainer?.clientHeight || 0
        return {
          moveIndex: sectionH - pad * 2 - indexH,
          moveNames: sectionH - pad * 2 - namesH,
          moveImages: root.clientHeight - imagesH,
          activateY: root.clientHeight / 2
        }
      }
      let dims = recompute()

      ScrollTrigger.create({
        trigger: spotlight,
        scroller: root,
        start: 'top top',
        end: () => '+=' + root.clientHeight * 5,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onRefresh: () => (dims = recompute()),
        onUpdate: (self) => {
          const progress = self.progress
          const current = Math.min(Math.floor(progress * total) + 1, total)
          if (projectIndexEl) {
            projectIndexEl.textContent = `${String(current).padStart(2, '0')}/${String(total).padStart(2, '0')}`
            gsap.set(projectIndexEl, { y: progress * dims.moveIndex })
          }
          if (projectImagesContainer) {
            gsap.set(projectImagesContainer, { y: progress * dims.moveImages })
          }
          const rootRect = root.getBoundingClientRect()
          projectImgs.forEach((img) => {
            const r = img.getBoundingClientRect()
            const top = r.top - rootRect.top
            const bottom = r.bottom - rootRect.top
            const active = top <= dims.activateY && bottom >= dims.activateY
            gsap.set(img, { opacity: active ? 1 : 0.5 })
          })
          projectNames.forEach((p, i) => {
            const start = i / total
            const end = (i + 1) / total
            const pr = Math.max(0, Math.min(1, (progress - start) / (end - start)))
            gsap.set(p, { y: -pr * dims.moveNames, color: pr > 0 && pr < 1 ? '#fff' : '#4a4a4a' })
          })
        }
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  // Fullscreen open with sound on click
  const handleOpenFullscreen = (videoEl) => {
    try {
      lastFsVideoRef.current = videoEl
      videoEl.muted = false
      videoEl.controls = true
      const safePlay = () => {
        const p = videoEl.play()
        if (p && p.catch) p.catch(() => {})
      }
      // Mark user intent window to auto-resume if the browser pauses during FS transition
      fsIntentRef.current = true
      setTimeout(() => (fsIntentRef.current = false), 2000)
      safePlay()
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen().finally(safePlay)
      } else if (videoEl.webkitEnterFullscreen) {
        // iOS Safari
        videoEl.webkitEnterFullscreen()
        safePlay()
      }
    } catch (e) {
      // no-op
    }
  }
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && lastFsVideoRef.current) {
        // Exit fullscreen: re-mute and hide controls
        lastFsVideoRef.current.muted = true
        lastFsVideoRef.current.controls = false
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])
  const handlePause = (e) => {
    if (fsIntentRef.current) {
      const v = e.currentTarget
      const p = v.play()
      if (p && p.catch) p.catch(() => {})
    }
  }

  const titles = [
    'Samsung Stars','Deepseek','Gestes Barrières','Sometimes','where are you going?',
    'Ripple','Häagen Dazs','Eat Your Young','Camaïeu'
  ]

  return (
    <div
      ref={rootRef}
      className="projects-overlay"
      style={{
        width: '80vw',
        height: '80vh',
        background: '#141414',
        color: '#fff',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: 8,
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)'
      }}
    >
      <style>{`
        * { box-sizing: border-box }
        /* Modern, minimal scrollbar (scoped to this overlay only) */
        .projects-overlay {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #7C6CF6 #1a1a1a; /* thumb / track */
        }
        .projects-overlay::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .projects-overlay::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 8px;
        }
        .projects-overlay::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #7C6CF6, #5a4ef0);
          border-radius: 8px;
          border: 2px solid #1a1a1a;
        }
        .projects-overlay::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #8a7fff, #6a5eff);
        }
        .projects-overlay::-webkit-scrollbar-corner {
          background: transparent;
        }

        .projects-header {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 14px 24px;
          background: linear-gradient(180deg, rgba(20,20,20,0.96), rgba(20,20,20,0.65), rgba(20,20,20,0));
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(2px);
        }
        .projects-header h2 {
          margin: 0;
          font-size: clamp(20px, 3vw, 32px);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 800;
          opacity: 0.92;
        }

        .spotlight { position: relative; width:100%; height:100vh; padding:2rem; overflow:hidden }
        .project-index h1 { text-transform: uppercase; font-size: clamp(3rem, 5vw, 7rem); font-weight:400; line-height:1 }
        .project-images { position:absolute; top:0; left:50%; transform:translateX(-50%); width:35%; padding:50vh 0; display:flex; flex-direction:column; gap:.5rem; z-index:0 }
        .project-img { width:100%; aspect-ratio:16/9; opacity:.5; transition: transform .25s ease, opacity .3s ease, box-shadow .25s ease; overflow:hidden; border-radius:10px; background:#222; transform-origin:center }
        .project-img:hover { transform: scale(1.04); opacity:1; cursor:pointer; z-index:2; box-shadow: 0 12px 30px rgba(0,0,0,0.35) }
        .project-img img, .project-img video { width:100%; height:100%; object-fit:cover; display:block }
        .project-names { position:absolute; right:2rem; bottom:2rem; display:flex; flex-direction:column; align-items:flex-end }
        .project-names p { color:#4a4a4a; font-size:1.5rem; font-weight:500; line-height:1.25; margin:.2rem 0 }
        @media (max-width: 1000px) {
          .project-images { width: calc(100% - 4rem); gap: 25vh }
          .project-names p { color:#fff !important }
        }
      `}</style>

      <div className="projects-header">
        <h2>Projects</h2>
      </div>

      <section className="spotlight">
        <div className="project-index">
          <h1>01/09</h1>
        </div>
        <div className="project-images">
          {Array.from({ length: titles.length }).map((_, i) => (
            <div className="project-img" key={i}>
              <video
                src={`/img${i + 1}.mp4`}
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                onClick={(e) => handleOpenFullscreen(e.currentTarget)}
                onPause={handlePause}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,#3a3a3a,#1f1f1f)'
                }}
              />
            </div>
          ))}
        </div>
        <div className="project-names">
          {titles.map((t, idx) => (
            <p key={idx}>{t}</p>
          ))}
        </div>
      </section>
    </div>
  )
}

