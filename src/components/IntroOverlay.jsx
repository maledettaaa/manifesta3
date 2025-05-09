import { useState, useEffect } from 'react';
import '../styles/IntroOverlay.css';

const IntroOverlay = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleClick = () => {
      setVisible(false);
    };

    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className={`intro-overlay ${visible ? 'visible' : 'hidden'}`}>
      <div className="intro-content">
        <div className="mouse-container">
          <div className="mouse">
            <div className="mouse-wheel"></div>
          </div>
          <div className="mouse-drag">
            <div className="drag-arrow left"></div>
            <div className="drag-arrow right"></div>
          </div>
        </div>
        <h2>Explore Manifesta</h2>
        <p>Click & drag to navigate</p>
        <div className="click-anywhere">Click anywhere to begin</div>
      </div>
    </div>
  );
};

export default IntroOverlay;