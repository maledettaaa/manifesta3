import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { MapControls, Plane, useTexture, Text } from "@react-three/drei";
import * as THREE from 'three';
import imagesData from '../Service/images.json';
import { useState, useCallback, useEffect, Suspense, useMemo, useRef } from 'react';
import imageDescriptions from '../Service/imageDescriptions.json';

// Helper function to create a rounded rectangle texture
const createRoundedRectTexture = (width, height, radius) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas with a transparent background
  ctx.clearRect(0, 0, width, height);
  
  // Draw a rounded rectangle
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  
  // Fill with white
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
};

// Component to render a single image plane with error handling
function ImagePlane({ path, position, id, onClick }) {
  // Always call hooks at the top level, not conditionally
  const texture = useTexture(path);

  // Handle errors with state instead of try/catch around hooks
  const [hasError, setHasError] = useState(false);
  
  // Use useEffect to handle texture loading errors
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading texture for image ${id}: ${path}`);
      setHasError(true);
    };
    
    // Add error event listener to texture
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, id, path]);

  // Get the natural dimensions of the loaded texture
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  
  // Use useEffect to get the natural dimensions once texture is loaded
  useEffect(() => {
    if (texture && texture.image) {
      const aspectRatio = texture.image.width / texture.image.height;
      // Keep a reasonable size in the 3D space while maintaining aspect ratio
      const maxDimension = 1.5; // Maximum size in any dimension
      let width, height;
      
      if (aspectRatio > 1) {
        // Landscape image
        width = Math.min(maxDimension, aspectRatio);
        height = width / aspectRatio;
      } else {
        // Portrait image
        height = Math.min(maxDimension, 1 / aspectRatio);
        width = height * aspectRatio;
      }
      
      setDimensions({ width, height });
    }
  }, [texture]);

  return (
    <Plane 
      args={[dimensions.width, dimensions.height]} 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id, path, position);
      }}
    > 
      <meshStandardMaterial 
        map={hasError ? null : texture} 
        color={hasError ? "#ff6b9d" : "#ffffff"}
        side={THREE.DoubleSide} 
      /> 
    </Plane>
  );
}

// Info window component that appears next to an image
function InfoWindow({ image, position }) {
  console.log("Rendering InfoWindow with:", { image, position });
  
  // Load info icon with error handling
  const [hasIconError, setHasIconError] = useState(false);
  const infoIcon = useTexture('/assets/icons/info.png');
  
  // Add error handling for icon loading
  useEffect(() => {
    const handleError = () => {
      console.error('Error loading info icon');
      setHasIconError(true);
    };
    
    if (infoIcon && infoIcon.source) {
      const source = infoIcon.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [infoIcon]);
  
  // Get the full image data from imagesData
  const imageData = imagesData.find(img => img.id === image.id) || {};
  
  return (
    <group position={[position[0] + 1.5, position[1], position[2] + 0.1]}>
      {/* Info window background */}
      <Plane args={[2, 1.5]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </Plane>
      
      {/* Info icon in the corner */}
      <Plane args={[0.4, 0.4]} position={[-0.7, 0.5, 0.01]}>
        <meshBasicMaterial 
          map={hasIconError ? null : infoIcon} 
          color={hasIconError ? "#ff6b9d" : "#ffffff"}
          transparent 
          opacity={0.9} 
        />
      </Plane>
      
      {/* Title text */}
      <Text 
        position={[0, 0.5, 0.01]}
        fontSize={0.15}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.title || "Untitled"}
      </Text>
      
      {/* Description text */}
      <Text 
        position={[0, 0.2, 0.01]}
        fontSize={0.1}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.description || "No description available"}
      </Text>
      
      {/* Details text */}
      <Text 
        position={[0, -0.2, 0.01]}
        fontSize={0.08}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        overflowWrap="break-word"
      >
        {imageData.details || "No additional details available"}
      </Text>
    </group>
  );
}

// Enhanced zoomed image view with error handling
function ZoomedImageView({ imagePath, onClose, onNext, onPrevious }) {
  const texture = useTexture(imagePath);
  const [hasError, setHasError] = useState(false);
  const { size } = useThree();
  
  // Load navigation icons with error handling
  const [hasIconError, setHasIconError] = useState(false);
  const prevIcon = useTexture('/assets/icons/left-arrow.png');
  const nextIcon = useTexture('/assets/icons/right-arrow.png');
  const closeIcon = useTexture('/assets/icons/close.png');
  
  // Add error handling for icon loading
  useEffect(() => {
    const handleError = () => {
      console.error('Error loading navigation icons');
      setHasIconError(true);
    };
    
    const icons = [prevIcon, nextIcon, closeIcon];
    
    icons.forEach(icon => {
      if (icon && icon.source && icon.source.data) {
        icon.source.data.addEventListener('error', handleError);
      }
    });
    
    return () => {
      icons.forEach(icon => {
        if (icon && icon.source && icon.source.data) {
          icon.source.data.removeEventListener('error', handleError);
        }
      });
    };
  }, [prevIcon, nextIcon, closeIcon]);
  
  // Remove camera manipulation
  const imageAspect = texture && texture.image ? texture.image.width / texture.image.height : 1;
  const viewportAspect = size.width / size.height;
  
  let width, height;
  if (imageAspect > viewportAspect) {
    width = 8; // Fixed width
    height = width / imageAspect;
  } else {
    height = 8; // Fixed height
    width = height * imageAspect;
  }

  return (
    <group>
      {/* Semi-transparent background */}
      <Plane 
        args={[size.width / 50, size.height / 50]} 
        position={[0, 0, -0.1]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#000000" transparent opacity={0.85} />
      </Plane>
      
      {/* Image with frame */}
      <group>
        {/* Frame */}
        <Plane 
          args={[width + 0.1, height + 0.1]} 
          position={[0, 0, -0.01]}
        >
          <meshBasicMaterial color="#ffffff" />
        </Plane>
        
        {/* Image */}
        <Plane args={[width, height]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            map={hasError ? null : texture} 
            color={hasError ? "#ff6b9d" : "#ffffff"}
            transparent 
          />
        </Plane>
      </group>
      
      {/* Navigation controls with icons */}
      <group position={[0, -height/2 - 0.8, 0]}>
        {/* Previous button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[-2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : prevIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Next button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : nextIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Close button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : closeIcon} 
            color="#ffffff" 
            transparent
          />
        </Plane>
      </group>
    </group>
  );
}

// Create a component that renders a fixed overlay using HTML and CSS
// In the FixedImagePopup component
function FixedImagePopup({ image, onClose, onNext, onPrevious }) {
  const [hasError, setHasError] = useState(false);
  const texture = useTexture(image.path);
  
  // Get description from imageDescriptions.json
  const description = imageDescriptions[image.path] || "No description available.";
  
  // Add error handling for texture loading
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading texture for popup image: ${image.path}`);
      setHasError(true);
    };
    
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, image.path]);
  
  // Use useFrame to ensure the popup is always in front of the camera
  const popupRef = useRef();
  const [popupScale, setPopupScale] = useState(0.7); // Start smaller

  // Animate the popup scale when it appears
  useEffect(() => {
    let animationFrame;
    let scale = 0.7;
    const animate = () => {
      scale += (1 - scale) * 0.15; // Easing
      setPopupScale(scale);
      if (Math.abs(scale - 1) > 0.01) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setPopupScale(1);
      }
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [image]);

  useFrame(({ camera }) => {
    if (popupRef.current) {
      popupRef.current.position.copy(camera.position);
      popupRef.current.position.z -= 5;
      popupRef.current.quaternion.copy(camera.quaternion);
      popupRef.current.scale.set(popupScale, popupScale, popupScale); // Apply scale
    }
  });
  
  // Calculate image aspect ratio
  const imageAspect = texture && texture.image ? texture.image.width / texture.image.height : 1;
  
  // Fixed card dimensions
  const cardWidth = 10;
  const cardHeight = 7;  // Reduced from 8 to 7 for a less tall appearance
  
  // Fixed image container dimensions
  const imageContainerWidth = 5;
  const imageContainerHeight = 4.5;  // Adjusted to match the new card height
  
  // Calculate image dimensions to fit within container while preserving aspect ratio
  let imageWidth, imageHeight;
  if (imageAspect >= 1) {
    // Landscape image
    imageWidth = imageContainerWidth;
    imageHeight = imageWidth / imageAspect;
    
    // If height exceeds container, scale down
    if (imageHeight > imageContainerHeight) {
      imageHeight = imageContainerHeight;
      imageWidth = imageHeight * imageAspect;
    }
  } else {
    // Portrait image
    imageHeight = imageContainerHeight;
    imageWidth = imageHeight * imageAspect;
    
    // If width exceeds container, scale down
    if (imageWidth > imageContainerWidth) {
      imageWidth = imageContainerWidth;
      imageHeight = imageWidth / imageAspect;
    }
  }
  
  // Fixed text box dimensions
  const textBoxWidth = 3.2;
  const textBoxHeight = 4.5;  // Adjusted to match the new card height
  
  // Define rounded corners parameters
  const cornerRadius = 0.2; // Adjust this value to control the roundness
  const mainCardCornerRadius = 0.5; // For the main card background
  const closeButtonPlaneSize = 0.5; // Size of the close button background plane
  const closeButtonCornerRadius = closeButtonPlaneSize / 2; // To make it a circle

  // Create rounded rectangle textures for masking
  const imageRoundedMask = useMemo(() => 
    createRoundedRectTexture(imageWidth * 100, imageHeight * 100, cornerRadius * 100)
  , [imageWidth, imageHeight, cornerRadius]);
  
  const textBoxRoundedMask = useMemo(() => 
    createRoundedRectTexture(textBoxWidth * 100, textBoxHeight * 100, cornerRadius * 100)
  , [textBoxWidth, textBoxHeight, cornerRadius]);

  const mainCardRoundedMask = useMemo(() =>
    createRoundedRectTexture(cardWidth * 100, cardHeight * 100, mainCardCornerRadius * 100)
  , [cardWidth, cardHeight, mainCardCornerRadius]);

  const closeButtonCircularMask = useMemo(() =>
    createRoundedRectTexture(closeButtonPlaneSize * 100, closeButtonPlaneSize * 100, closeButtonCornerRadius * 100)
  , [closeButtonPlaneSize, closeButtonCornerRadius]);
  
  return (
    <group ref={popupRef} renderOrder={1000}>
      {/* Semi-transparent background */}
      <Plane 
        args={[30, 30]} 
        position={[0, 0, -1]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#000000" transparent opacity={0.0} depthTest={false} />
      </Plane>
      
      {/* Card container */}
      <group position={[0, 0, 0]}>
        {/* Main card */}
        <Plane 
          args={[cardWidth, cardHeight]} 
          position={[0, 0, 0]}
        >
          <meshBasicMaterial 
            color="#ffffff" 
            depthTest={false}
            transparent
            alphaMap={mainCardRoundedMask}
            alphaTest={0.5}
          />
        </Plane>
        
        {/* Image container - fixed position and size */}
        <group position={[-2, 0.3, 0.01]}>  {/* Moved from [-2, 0, 0.01] to [-2, 0.3, 0.01] */}
          {/* Image with rounded corners */}
          <Plane 
            args={[imageWidth, imageHeight]} 
            position={[0, 0, 0]}
          >
            <meshBasicMaterial 
              map={hasError ? null : texture} 
              transparent 
              depthTest={false}
              color={hasError ? "#ff6b9d" : "#ffffff"}
              alphaMap={imageRoundedMask}
              alphaTest={0.5}
            />
          </Plane>
        </group>
        
        {/* Description box - adjusted position slightly up and to the right */}
        <group position={[2.5, 0.3, 0.01]}>
          <Plane
            args={[textBoxWidth, textBoxHeight]}
            position={[0, 0, 0]}
          >
            <meshBasicMaterial 
              color="#333333" 
              transparent 
              opacity={0.7} 
              depthTest={false}
              alphaMap={textBoxRoundedMask}
              alphaTest={0.5}
            />
          </Plane>
          
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.18}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={textBoxWidth - 0.4}
            depthTest={false}
            textAlign="center"
          >
            {description}
          </Text>
        </group>
        
        {/* Navigation buttons - fixed position */}
        <group position={[3.5, -cardHeight/2 + 1, 0]}>
          <Plane args={[1.2, 0.5]} position={[-0.7, 0, 0]} onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}>
            <meshBasicMaterial color="#eeeeee" transparent opacity={0.9} depthTest={false} />
          </Plane>
          <Text
            position={[-0.7, 0, 0.01]}
            fontSize={0.15}
            color="#222222"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            &lt; Previous
          </Text>
          
          <Plane args={[1.2, 0.5]} position={[0.7, 0, 0]} onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}>
            <meshBasicMaterial color="#eeeeee" transparent opacity={0.9} depthTest={false} />
          </Plane>
          <Text
            position={[0.7, 0, 0.01]}
            fontSize={0.15}
            color="#222222"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            Next &gt;
          </Text>
        </group>
        
        {/* Close button (X) */}
        <group position={[cardWidth/2 - 0.5, cardHeight/2 - 0.5, 0.02]}>
          <Plane 
            args={[closeButtonPlaneSize, closeButtonPlaneSize]} 
            position={[0, 0, 0]} 
            onClick={onClose}
          >
            <meshBasicMaterial 
              color="#ff5555" 
              transparent 
              opacity={0.9} 
              depthTest={false}
              alphaMap={closeButtonCircularMask}
              alphaTest={0.5}
            />
          </Plane>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.22} // Made the X icon smaller
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            X
          </Text>
        </group>
      </group>
    </group>
  );
}

// New component to hold the scene content and R3F hooks
function SceneContent({
  showPopup,
  selectedImageIndex,
  imagesData,
  planePositions,
  handleImageClick,
  handleClosePopup,
  handleNext,
  handlePrevious
}) {
  const controlsRef = useRef();
  const { camera } = useThree(); // Moved from Experience

  // Refs for animation targets and state - Moved from Experience
  const targetCameraPositionRef = useRef(null);
  const targetControlsLookAtRef = useRef(null);
  const isAnimatingPanRef = useRef(false);

  // Keyboard navigation handler - Moved from Experience
  useEffect(() => {
    const panOffset = new THREE.Vector3();

    const handleKeyDown = (event) => {
      if (showPopup) return;
      
      const moveDistance = 0.2;
      
      if (!controlsRef.current || !controlsRef.current.object) {
        console.warn("MapControls ref or its camera object not yet available for keydown.");
        return;
      }

      if (!targetCameraPositionRef.current) {
        targetCameraPositionRef.current = controlsRef.current.object.position.clone();
      }
      if (!targetControlsLookAtRef.current) {
        targetControlsLookAtRef.current = controlsRef.current.target.clone();
      }

      const currentCamera = controlsRef.current.object;
      let didPan = false;

      switch (event.key) {
        case 'ArrowUp':
          panOffset.setFromMatrixColumn(currentCamera.matrix, 1).multiplyScalar(moveDistance);
          didPan = true;
          break;
        case 'ArrowDown':
          panOffset.setFromMatrixColumn(currentCamera.matrix, 1).multiplyScalar(-moveDistance);
          didPan = true;
          break;
        case 'ArrowLeft':
          panOffset.setFromMatrixColumn(currentCamera.matrix, 0).multiplyScalar(-moveDistance);
          didPan = true;
          break;
        case 'ArrowRight':
          panOffset.setFromMatrixColumn(currentCamera.matrix, 0).multiplyScalar(moveDistance);
          didPan = true;
          break;
        default:
          break;
      }

      if (didPan) {
        targetCameraPositionRef.current.add(panOffset);
        targetControlsLookAtRef.current.add(panOffset);
        isAnimatingPanRef.current = true;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup, camera]); // Added camera to dependencies as currentCamera is derived from it

  // useFrame hook for smooth panning animation - Moved from Experience
  useFrame(() => {
    if (isAnimatingPanRef.current && controlsRef.current && targetCameraPositionRef.current && targetControlsLookAtRef.current) {
      const smoothingFactor = 0.1;
      const distanceThreshold = 0.01;

      // Ensure camera object exists before trying to lerp its position
      if (controlsRef.current.object) {
        controlsRef.current.object.position.lerp(targetCameraPositionRef.current, smoothingFactor);
      }
      controlsRef.current.target.lerp(targetControlsLookAtRef.current, smoothingFactor);
      controlsRef.current.update();

      if (controlsRef.current.object) {
        const distanceToTargetPos = controlsRef.current.object.position.distanceTo(targetCameraPositionRef.current);
        const distanceToTargetLookAt = controlsRef.current.target.distanceTo(targetControlsLookAtRef.current);

        if (distanceToTargetPos < distanceThreshold && distanceToTargetLookAt < distanceThreshold) {
          controlsRef.current.object.position.copy(targetCameraPositionRef.current);
          controlsRef.current.target.copy(targetControlsLookAtRef.current);
          isAnimatingPanRef.current = false;
        }
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>
        <MapControls 
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.03} // Changed from 0.05 to reduce gradual slowdown
          screenSpacePanning={true} 
          minDistance={1}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          enableZoom={true}
          zoomSpeed={1.2}   // Kept as is, good base speed
          enablePan={true}
          panSpeed={1.2}    // Increased from 1.0 for faster panning
          enableRotate={false}
          mouseButtons={{ 
            LEFT: THREE.MOUSE.PAN,    
            MIDDLE: THREE.MOUSE.DOLLY,  
            RIGHT: THREE.MOUSE.PAN     
          }}
        />
        {imagesData.map((image, index) => (
          <ImagePlane
            key={image.id}
            id={image.id}
            path={image.path}
            position={planePositions[index]}
            onClick={handleImageClick}
          />
        ))}
      </Suspense>
      {showPopup && selectedImageIndex !== null && (
        <FixedImagePopup
          image={imagesData[selectedImageIndex]}
          onClose={handleClosePopup}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </>
  );
}

function Experience() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState(''); // This state seems unused, consider removing if not needed
  const planePositions = useMemo(() => 
    imagesData.map(image => image.position || [0, 0, 0])
  , []);
  
  // const controlsRef = useRef(); // Moved to SceneContent
  // const { camera } = useThree(); // Moved to SceneContent

  // Refs for animation targets and state // Moved to SceneContent
  // const targetCameraPositionRef = useRef(null);
  // const targetControlsLookAtRef = useRef(null);
  // const isAnimatingPanRef = useRef(false);

  const handleImageClick = useCallback((id, path, position) => {
    const index = imagesData.findIndex(img => img.id === id);
    setSelectedImageIndex(index);
    setShowPopup(true);
    // setPopupText(''); // Or load saved text for this image if you want
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % imagesData.length);
    // setPopupText('');
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + imagesData.length) % imagesData.length);
    // setPopupText('');
  }, []);
  
  // Keyboard navigation handler // Moved to SceneContent
  // useEffect(() => { ... });

  // useFrame hook for smooth panning animation // Moved to SceneContent
  // useFrame(() => { ... });

  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 10] }}>
      <SceneContent
        showPopup={showPopup}
        selectedImageIndex={selectedImageIndex}
        imagesData={imagesData}
        planePositions={planePositions}
        handleImageClick={handleImageClick}
        handleClosePopup={handleClosePopup}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
      />
    </Canvas>
  );
}

export default Experience;