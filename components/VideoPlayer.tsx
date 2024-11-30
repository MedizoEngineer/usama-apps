// Enable client-side rendering (used in Next.js for interactive components)
"use client";

// Import necessary React hooks and types
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { VideoPlayerProps } from "../types"; // Importing type definitions

// Extended props for VideoPlayer, including a function to pass the video element reference
interface ExtendedVideoPlayerProps extends VideoPlayerProps {
  setVideoRef: (ref: HTMLVideoElement) => void;
}

// Custom hook for managing video player state and actions
const useVideoPlayer = (
  videoRef: React.RefObject<HTMLVideoElement>, // Reference to the video element
  onTimeUpdate?: (currentTime: number) => void // Callback to handle time updates
) => {
  // Manage the state of the video player
  const [videoState, setVideoState] = useState({
    isPlaying: false, // Tracks play/pause state
    volume: 1, // Video volume (1 = max, 0 = mute)
    isMuted: false, // Tracks whether the video is muted
    progress: 0, // Video progress percentage (0 to 100)
    isFullscreen: false, // Tracks fullscreen state
    playbackRate: 1, // Video playback speed (e.g., 1x, 1.5x)
    currentTime: 0, // Current playback time in seconds
    duration: 0, // Total video duration in seconds
    buffered: 0, // Buffered video percentage (0 to 100)
  });

  // Toggle play/pause state of the video
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoState.isPlaying) {
        videoRef.current.pause(); // Pause the video
      } else {
        videoRef.current.play(); // Play the video
      }
      // Update state to reflect the change
      setVideoState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [videoRef, videoState.isPlaying]);

  // Handle volume change (slider input)
  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(event.target.value); // Get the new volume value
      if (videoRef.current) {
        videoRef.current.volume = newVolume; // Set video volume
        setVideoState((prev) => ({
          ...prev,
          volume: newVolume,
          isMuted: newVolume === 0, // Update mute state if volume is zero
        }));
      }
    },
    [videoRef]
  );

  // Toggle mute/unmute state
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const muted = !videoState.isMuted; // Toggle mute state
      videoRef.current.muted = muted; // Apply mute/unmute to the video element
      setVideoState((prev) => ({ ...prev, isMuted: muted }));
    }
  }, [videoRef, videoState.isMuted]);

  // Update progress, duration, and buffered state during playback
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime; // Current playback time
      const duration = videoRef.current.duration; // Total video duration
      const buffered = videoRef.current.buffered.length
        ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1) // End of buffered range
        : 0;

      // Update the state
      setVideoState((prev) => ({
        ...prev,
        currentTime,
        duration,
        progress: (currentTime / duration) * 100, // Calculate progress percentage
        buffered: (buffered / duration) * 100, // Calculate buffered percentage
      }));

      if (onTimeUpdate) onTimeUpdate(currentTime); // Trigger callback if provided
    }
  }, [videoRef, onTimeUpdate]);

  // Seek to a specific time in the video
  const handleSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (videoRef.current) {
        const newTime =
          (parseFloat(event.target.value) / 100) * videoRef.current.duration; // Convert percentage to time
        videoRef.current.currentTime = newTime; // Set the new playback time
      }
    },
    [videoRef]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(console.error); // Enter fullscreen
        setVideoState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        document.exitFullscreen().catch(console.error); // Exit fullscreen
        setVideoState((prev) => ({ ...prev, isFullscreen: false }));
      }
    }
  }, [videoRef]);

  // Skip forward or backward in the video
  const handleSkip = useCallback(
    (time: number) => {
      if (videoRef.current) {
        // Add or subtract time from the current playback position
        videoRef.current.currentTime = Math.min(
          Math.max(videoRef.current.currentTime + time, 0),
          videoRef.current.duration
        );
      }
    },
    [videoRef]
  );

  // Change the playback speed
  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate; // Set playback rate
        setVideoState((prev) => ({ ...prev, playbackRate: rate }));
      }
    },
    [videoRef]
  );

  // Restart video playback from the beginning
  const restartVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Reset playback time
      setVideoState((prev) => ({ ...prev, progress: 0 })); // Reset progress
    }
  }, [videoRef]);

  // Return all state and functions for use in the component
  return {
    videoState,
    togglePlayPause,
    handleVolumeChange,
    toggleMute,
    handleTimeUpdate,
    toggleFullscreen,
    handleSeek,
    handleSkip,
    handlePlaybackRateChange,
    restartVideo,
  };
};

// Main VideoPlayer component
const VideoPlayer: React.FC<ExtendedVideoPlayerProps> = ({ onTimeUpdate, setVideoRef }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null); // Create a reference for the video element

  // Use the custom hook for video player functionality
  const {
    videoState,
    togglePlayPause,
    handleVolumeChange,
    toggleMute,
    handleTimeUpdate,
    toggleFullscreen,
    handleSeek,
    handleSkip,
    handlePlaybackRateChange,
    restartVideo,
  } = useVideoPlayer(videoRef, onTimeUpdate);

  // Pass the video element reference to the parent component
  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
    }
  }, [setVideoRef]);

  // Format time as "HH:MM:SS" for display
  const formattedTime = useMemo(() => {
    const format = (time: number) => new Date(time * 1000).toISOString().substr(11, 8);
    return `${format(videoState.currentTime)} / ${format(videoState.duration)}`;
  }, [videoState.currentTime, videoState.duration]);

  return (
    <div className="video-player" style={{ maxWidth: "100%", margin: "0 auto", padding: "20px" }}>
      {/* Video element */}
      <video
        ref={videoRef}
        src="/videos/lesson1.mp4"
        width="100%"
        onTimeUpdate={handleTimeUpdate} // Update time during playback
        onClick={togglePlayPause} // Play/pause on click
        onDoubleClick={toggleFullscreen} // Enter/exit fullscreen on double click
        style={{
          cursor: "pointer",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        }}
      />

      {/* Video controls */}
      <div className="controls" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={togglePlayPause}>{videoState.isPlaying ? "Pause" : "Play"}</button>
        <button onClick={() => handleSkip(-10)}>⏪ -10s</button>
        <button onClick={() => handleSkip(10)}>⏩ +10s</button>
        <button onClick={restartVideo}>⏮ Restart</button>
        <input
          type="range"
          min="0"
          max="100"
          value={videoState.progress}
          onChange={handleSeek}
        />
        <span>{formattedTime}</span>
        <button onClick={toggleMute}>{videoState.isMuted ? "Unmute" : "Mute"}</button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={videoState.volume}
          onChange={handleVolumeChange}
        />
        <button onClick={toggleFullscreen}>
          {videoState.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <select
          value={videoState.playbackRate}
          onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
        >
          {[0.5, 1, 1.5, 2].map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default VideoPlayer;
