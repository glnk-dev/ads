import { useState } from 'react';
import { VideoAdPlayer, SAMPLE_VAST_TAGS } from './components/VideoAdPlayer';
import './App.css';

type AdType = keyof typeof SAMPLE_VAST_TAGS;

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [adComplete, setAdComplete] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState<AdType>('skippable');

  const handleStartAd = () => {
    setIsPlaying(true);
    setAdComplete(false);
  };

  const handleAdComplete = () => {
    setIsPlaying(false);
    setAdComplete(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAdComplete(false);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎬 Video Ads Demo</h1>
          <p className="subtitle">
            Google IMA SDK integration for React
          </p>
        </header>

        <main className="main">
          {!isPlaying && !adComplete && (
            <div className="start-section">
              <div className="card">
                <h2>Select Ad Type</h2>
                <div className="ad-type-selector">
                  {(Object.keys(SAMPLE_VAST_TAGS) as AdType[]).map((type) => (
                    <button
                      key={type}
                      className={`ad-type-btn ${selectedAdType === type ? 'active' : ''}`}
                      onClick={() => setSelectedAdType(type)}
                    >
                      {type === 'linear' && '📹 Linear Ad (10s)'}
                      {type === 'skippable' && '⏭️ Skippable Ad (skip after 5s)'}
                      {type === 'redirect' && '🔗 Redirect Ad'}
                    </button>
                  ))}
                </div>

                <button className="play-btn" onClick={handleStartAd}>
                  <span className="icon">▶</span>
                  Play Video Ad
                </button>

                <p className="hint">
                  Note: Google test ads are static placeholders. Real video ads require Ad Manager integration.
                </p>
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="playing-section">
              <VideoAdPlayer
                vastTagUrl={SAMPLE_VAST_TAGS[selectedAdType]}
                autoplay={true}
                width={720}
                height={405}
                onAdComplete={handleAdComplete}
                onAdError={(error) => {
                  console.error('Ad error:', error);
                  handleAdComplete();
                }}
              />
              <p className="ad-notice">
                Click on the ad or wait for it to complete
              </p>
            </div>
          )}

          {adComplete && (
            <div className="complete-section">
              <div className="success-card">
                <div className="success-icon">✅</div>
                <h2>Ad Complete!</h2>
                <p>The video ad has finished playing.</p>
                <button className="reset-btn" onClick={handleReset}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>
            Powered by <strong>Google IMA SDK</strong> • 
            <a href="https://developers.google.com/interactive-media-ads" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
