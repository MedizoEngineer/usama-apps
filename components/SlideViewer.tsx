"use client"; // Enables client-side rendering for this component (used in Next.js)
import Image from 'next/image'; // Next.js Image component for optimized image handling
import { SlideViewerProps } from '../types'; // Import the types for slide viewer props
import { useState, useEffect, useCallback, useMemo } from 'react';

// Extending the props to include additional functionality
interface ExtendedSlideViewerProps extends SlideViewerProps {
  onSlideClick: (slideNumber: number) => void; // Callback when a slide is clicked
  images: string[]; // Array of image URLs for the slides
}

// Main SlideViewer component
const SlideViewer: React.FC<ExtendedSlideViewerProps> = ({
  currentSlide, // Current slide number (used for callbacks)
  onSlideClick, // Callback triggered when a slide is clicked
  images, // Array of slide image URLs
}) => {
  // State for managing the currently displayed image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State for zoom level (scale of the image, 1 is default)
  const [zoomLevel, setZoomLevel] = useState(1);

  // State for image rotation (in degrees, e.g., 0, 90, 180, etc.)
  const [rotation, setRotation] = useState(0);

  // State for tracking fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to change the current image based on direction (-1 for previous, 1 for next)
  const changeImage = useCallback(
    (direction: 1 | -1) => {
      setCurrentImageIndex((prevIndex) =>
        // Wrap around to the start/end of the images array when navigating
        (prevIndex + direction + images.length) % images.length
      );
    },
    [images.length]
  );

  // Functions to adjust the zoom level
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4)); // Maximum zoom level: 4x
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1)); // Minimum zoom level: 1x

  // Functions to rotate the image (left and right)
  const rotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360); // Rotate counter-clockwise
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360); // Rotate clockwise

  // Function to reset zoom level and rotation to default values
  const resetView = () => {
    setZoomLevel(1); // Reset zoom to default
    setRotation(0); // Reset rotation to 0 degrees
  };

  // Function to download the current image
  const downloadImage = () => {
    const link = document.createElement('a'); // Create an anchor element
    link.href = images[currentImageIndex]; // Set the image URL as the download link
    link.download = `slide-${currentImageIndex + 1}.jpg`; // Default filename for download
    document.body.appendChild(link); // Append the link to the DOM
    link.click(); // Trigger the download
    document.body.removeChild(link); // Remove the link after download
  };

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen mode
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      // Exit fullscreen mode
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(!isFullscreen); // Update fullscreen state
  };

  // Memoized value for the current image source (updates only when `currentImageIndex` changes)
  const currentImageSrc = useMemo(() => images[currentImageIndex], [currentImageIndex, images]);

  // Effect to reset view (zoom/rotation) when exiting fullscreen mode
  useEffect(() => {
    if (!isFullscreen) {
      resetView(); // Reset zoom and rotation when fullscreen is exited
    }
  }, [isFullscreen]);

  // Keydown event handler for keyboard navigation and controls
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft': // Navigate to the previous slide
          changeImage(-1);
          break;
        case 'ArrowRight': // Navigate to the next slide
          changeImage(1);
          break;
        case '+': // Zoom in
          handleZoomIn();
          break;
        case '-': // Zoom out
          handleZoomOut();
          break;
        case 'r': // Reset view
          resetView();
          break;
        case '[': // Rotate left
          rotateLeft();
          break;
        case ']': // Rotate right
          rotateRight();
          break;
        default: // Do nothing for other keys
          break;
      }
    },
    [changeImage]
  );

  // Register keydown event listener on mount and cleanup on unmount
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown); // Add keydown listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Remove keydown listener
    };
  }, [handleKeyDown]);

  return (
    <div
      className={`slide-viewer ${isFullscreen ? 'fullscreen' : ''}`} // Add fullscreen class if active
      style={{
        maxWidth: isFullscreen ? '100%' : '80%', // Adjust container size for fullscreen
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Image container */}
      <div
        className="image-container"
        onClick={() => onSlideClick(currentSlide)} // Trigger callback on slide click
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Previous image button */}
        <button onClick={() => changeImage(-1)} aria-label="Previous image">
          &#10094;
        </button>

        {/* Current image */}
        <div
          className="image-wrapper"
          style={{
            cursor: 'pointer',
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, // Apply zoom and rotation
            transition: 'transform 0.3s ease', // Smooth transition for zoom/rotation changes
          }}
        >
          <Image
            src={currentImageSrc} // Display current image
            alt={`Slide ${currentImageIndex + 1} of ${images.length}`} // Alt text for accessibility
            width={isFullscreen ? 800 : 400} // Adjust image size for fullscreen
            height={isFullscreen ? 600 : 300}
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Next image button */}
        <button onClick={() => changeImage(1)} aria-label="Next image">
          &#10095;
        </button>
      </div>

      {/* Controls for zoom, rotation, reset, download, and fullscreen */}
      <div className="controls" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
        <button onClick={handleZoomIn} aria-label="Zoom In">
          🔍+
        </button>
        <button onClick={handleZoomOut} aria-label="Zoom Out">
          🔍-
        </button>
        <button onClick={rotateLeft} aria-label="Rotate Left">
          ↺
        </button>
        <button onClick={rotateRight} aria-label="Rotate Right">
          ↻
        </button>
        <button onClick={resetView} aria-label="Reset View">
          ⟳ Reset
        </button>
        <button onClick={downloadImage} aria-label="Download Image">
          ⬇ Download
        </button>
        <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Image indicators for navigation */}
      <div role="group" aria-label="Image indicators" style={{ marginTop: '1rem', display: 'flex', gap: '5px' }}>
        {images.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrentImageIndex(index)} // Navigate to specific slide
            aria-label={`Slide ${index + 1}`}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%', // Circular indicator
              backgroundColor: currentImageIndex === index ? '#3498db' : '#ccc', // Highlight active slide
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Current slide number and total slides */}
      <div style={{ marginTop: '1rem' }}>
        <p>
          Slide {currentImageIndex + 1} of {images.length}
        </p>
      </div>
    </div>
  );
};

export default SlideViewer;
