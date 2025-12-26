import { useEffect, useRef, useState, useCallback } from 'react';
import './VideoAdPlayer.css';

// Google IMA SDK sample VAST tags for testing
// Note: These are placeholder ads. Real video ads require Ad Manager/AdSense integration.
const SAMPLE_VAST_TAGS = {
  // Linear ad (10 seconds)
  linear: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s',
  // Skippable ad (skip after 5 seconds)
  skippable: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s',
  // Redirect ad
  redirect: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dredirectlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s',
};

interface VideoAdPlayerProps {
  vastTagUrl?: string;
  onAdComplete?: () => void;
  onAdError?: (error: string) => void;
  onAdStarted?: () => void;
  onAdProgress?: (remaining: number, duration: number) => void;
  autoplay?: boolean;
  width?: number;
  height?: number;
}

export function VideoAdPlayer({
  vastTagUrl = SAMPLE_VAST_TAGS.skippable,
  onAdComplete,
  onAdError,
  onAdStarted,
  onAdProgress,
  autoplay = false,
  width = 640,
  height = 360,
}: VideoAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adsLoaderRef = useRef<google.ima.AdsLoader | null>(null);
  const adsManagerRef = useRef<google.ima.AdsManager | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adInfo, setAdInfo] = useState<{
    title?: string;
    duration?: number;
    remaining?: number;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cleanup ads manager and loader
  const cleanupAds = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
      adsManagerRef.current = null;
    }
    if (adsLoaderRef.current) {
      adsLoaderRef.current.destroy();
      adsLoaderRef.current = null;
    }
  }, []);

  // Initialize Google IMA SDK
  const initializeIMA = useCallback(() => {
    if (!videoRef.current || !adContainerRef.current) return;
    if (typeof google === 'undefined' || !google.ima) {
      setError('IMA SDK not loaded');
      setIsLoading(false);
      return;
    }

    cleanupAds();

    try {
      // Create AdDisplayContainer
      const adDisplayContainer = new google.ima.AdDisplayContainer(
        adContainerRef.current,
        videoRef.current
      );
      adDisplayContainer.initialize();

      // Create AdsLoader
      const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
      adsLoaderRef.current = adsLoader;

      // Register event listeners
      adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (event) => {
          const adsManagerLoadedEvent = event as google.ima.AdsManagerLoadedEvent;
          const adsManager = adsManagerLoadedEvent.getAdsManager(
            { currentTime: 0, duration: 0 },
            { restoreCustomPlaybackStateOnAdBreakComplete: true }
          );
          adsManagerRef.current = adsManager;

          // AdsManager event listeners
          adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, () => {
            setIsLoading(false);
          });

          adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, (adEvent) => {
            const ad = (adEvent as google.ima.AdEvent).getAd();
            setIsPlaying(true);
            setAdInfo({
              title: ad.getTitle(),
              duration: ad.getDuration(),
              remaining: ad.getDuration(),
            });
            onAdStarted?.();

            // Update progress
            intervalRef.current = window.setInterval(() => {
              if (adsManagerRef.current) {
                const remaining = adsManagerRef.current.getRemainingTime();
                const duration = ad.getDuration();
                setAdInfo((prev) => ({ ...prev, remaining }));
                onAdProgress?.(remaining, duration);
              }
            }, 250);
          });

          adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, () => {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          });

          adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
            cleanupAds();
            onAdComplete?.();
          });

          adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, () => {
            onAdComplete?.();
          });

          adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (errorEvent) => {
            const adError = (errorEvent as google.ima.AdErrorEvent).getError();
            const errorMessage = adError.getMessage();
            setError(errorMessage);
            setIsLoading(false);
            onAdError?.(errorMessage);
            cleanupAds();
          });

          // Start the ad
          try {
            adsManager.init(width, height, google.ima.ViewMode.NORMAL);
            adsManager.start();
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start ad';
            setError(errorMessage);
            onAdError?.(errorMessage);
          }
        }
      );

      adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (errorEvent) => {
        const adError = (errorEvent as google.ima.AdErrorEvent).getError();
        const errorMessage = adError.getMessage();
        setError(errorMessage);
        setIsLoading(false);
        onAdError?.(errorMessage);
      });

      // Request ads with correlator for cache busting
      const adsRequest = new google.ima.AdsRequest();
      adsRequest.adTagUrl = vastTagUrl + '&correlator=' + Date.now();
      adsRequest.linearAdSlotWidth = width;
      adsRequest.linearAdSlotHeight = height;
      adsRequest.nonLinearAdSlotWidth = width;
      adsRequest.nonLinearAdSlotHeight = height / 3;

      adsLoader.requestAds(adsRequest);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize IMA';
      setError(errorMessage);
      setIsLoading(false);
      onAdError?.(errorMessage);
    }
  }, [vastTagUrl, width, height, cleanupAds, onAdComplete, onAdError, onAdStarted, onAdProgress]);

  useEffect(() => {
    if (autoplay) {
      initializeIMA();
    }
    return cleanupAds;
  }, [autoplay, initializeIMA, cleanupAds]);

  const handlePlayClick = () => {
    if (!isInitialized) {
      initializeIMA();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-ad-player" style={{ width, height }}>
      {/* Video element (ad renders on top) */}
      <video
        ref={videoRef}
        className="video-element"
        playsInline
        muted
      />

      {/* Ad container */}
      <div ref={adContainerRef} className="ad-container" />

      {/* Loading state */}
      {isLoading && isInitialized && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Loading ad...</p>
        </div>
      )}

      {/* Play button (when not autoplay) */}
      {!autoplay && !isInitialized && !error && (
        <div className="play-overlay" onClick={handlePlayClick}>
          <button className="play-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <p>Click to play ad</p>
        </div>
      )}

      {/* Ad info overlay */}
      {isPlaying && adInfo.remaining !== undefined && (
        <div className="ad-info-overlay">
          <span className="ad-badge">AD</span>
          <span className="ad-timer">
            {formatTime(adInfo.remaining)} / {formatTime(adInfo.duration || 0)}
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-overlay">
          <p>⚠️ {error}</p>
          <button onClick={() => {
            setError(null);
            setIsInitialized(false);
            setIsLoading(true);
          }}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export { SAMPLE_VAST_TAGS };
