import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import './FestivalVideoModal.css';

interface FestivalVideoModalProps {
  onVideoEnd: () => void;
  isWin: boolean;
}

const FestivalVideoModal: React.FC<FestivalVideoModalProps> = ({ onVideoEnd, isWin: _isWin }) => {
  const [showCounting, setShowCounting] = useState(false);
  const { setModalPause } = useGame();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Pause game when video modal is shown
  useEffect(() => {
    if (setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [setModalPause]);

  useEffect(() => {
    // Auto-play video
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  }, []);

  const handleVideoEnd = () => {
    // Video has ended; counting overlay should already be showing
    // Wait for remaining counting animation to finish before calling onVideoEnd
    const timer = setTimeout(() => {
      onVideoEnd();
    }, 1000); // Give ~1 second after video ends for counting to finish
    return () => clearTimeout(timer);
  };

  // Start showing the counting overlay immediately (parallel with video)
  // This makes the animation happen while the video is playing, not after it ends
  useEffect(() => {
    // Show counting after a short delay (video plays for ~3-4 seconds, show counting for last 2 seconds)
    const countingTimer = setTimeout(() => {
      setShowCounting(true);
    }, 1500); // Start showing counting 1.5 seconds in

    return () => clearTimeout(countingTimer);
  }, []);

  return (
    <div className="festival-video-overlay">
      <div className="festival-video-container">
        <div className="festival-title">
          Ваша команда на фестивале
        </div>
        
        <video
          ref={videoRef}
          className="festival-video"
          onEnded={handleVideoEnd}
          controls={false}
        >
          <source src="/videos/festvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {showCounting && (
          <div className="counting-overlay">
            <div className="counting-content">
              <div className="counting-spinner"></div>
              <div className="counting-text">Подсчёт результатов...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FestivalVideoModal;
