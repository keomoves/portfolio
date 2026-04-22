import { createRoot } from 'react-dom/client'
import { createContext, useContext, useState } from 'react'
import './styles.css'
import App from './App'

// Create Video Modal Context
export const VideoModalContext = createContext()

export function VideoModalProvider({ children }) {
  const [showVideo, setShowVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/lw3WAqcI8YI?autoplay=1')

  const openVideo = (url = 'https://www.youtube.com/embed/lw3WAqcI8YI?autoplay=1') => {
    setVideoUrl(url)
    setShowVideo(true)
  }

  const closeVideo = () => {
    setShowVideo(false)
    // notify app to restore camera state
    window.dispatchEvent(new CustomEvent('restoreCamera'))
  }

  return (
    <VideoModalContext.Provider value={{ showVideo, videoUrl, openVideo, closeVideo }}>
      {children}
      {/* Video Modal */}
      {showVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            height: '90%',
            backgroundColor: 'black'
          }}>
            {/* Close button */}
            <button
              onClick={closeVideo}
              style={{
                position: 'absolute',
                top: '-25px',
                right: '-30px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              ✕
            </button>

            {/* YouTube iframe */}
            <iframe
              src={videoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </div>
        </div>
      )}
    </VideoModalContext.Provider>
  )
}

createRoot(document.getElementById('root')).render(
  <VideoModalProvider>
    <App />
    <img
      src="/logo Keo.webp"
      alt="Logo Keo"
      style={{ position: 'absolute', bottom: 40, left: 40, width: 100, cursor: 'pointer' }}
      onClick={() => window.location.href = 'mailto:keomonivong.chou@gmail.com'}
    />
  </VideoModalProvider>
)
