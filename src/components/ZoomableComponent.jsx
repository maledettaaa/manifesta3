// ... existing code ...

// Modify your drag handler to account for zoom level with adaptive speed
const handleDrag = (e) => {
  // Base pan speed factor
  let panSpeedFactor = 2.5; 

  // Increase pan speed slightly if zoomed in
  // Assuming currentZoomLevel is available in this scope
  // Adjust the threshold (e.g., 5.0) as needed.
  // When currentZoomLevel is less than this, it's considered "zoomed in".
  if (currentZoomLevel < 5.0) { 
    panSpeedFactor = 3.0; // Slightly faster when zoomed in
  }

  // Calculate movement delta based on mouse movement and the dynamic pan speed factor
  const deltaX = e.movementX * panSpeedFactor;
  const deltaY = e.movementY * panSpeedFactor;
  
  // Update position with the calculated movement
  // Assuming 'position' and 'setPosition' are state variables for the component's position
  setPosition((prevPosition) => ({
    x: prevPosition.x + deltaX,
    y: prevPosition.y + deltaY
  }));
};

// Improved zoom limit function with better constraints
const handleZoom = (delta) => {
  // Calculate new zoom level
  let newZoomLevel = currentZoomLevel + delta;
  
  // Set minimum and maximum zoom levels
  const minZoomLevel = 15.0; // Represents the maximum "zoomed-out" state (largest numeric value for zoom level)
  const maxZoomLevel = 1.0;  // Represents the maximum "zoomed-in" state (smallest numeric value for zoom level)
  
  // Apply zoom with strict limits
  // Corrected condition: zoom level must be between maxZoomLevel (e.g., 1.0) and minZoomLevel (e.g., 15.0)
  if (newZoomLevel >= maxZoomLevel && newZoomLevel <= minZoomLevel) {
    setCurrentZoomLevel(newZoomLevel);
    // If the new valid zoom level is exactly the max zoom-out level, center.
    if (newZoomLevel === minZoomLevel) {
      setPosition({ x: 0, y: 0 });
    }
  } else if (newZoomLevel < maxZoomLevel) { // Trying to zoom in beyond the limit (e.g., newZoomLevel is 0.5, maxZoomLevel is 1.0)
    setCurrentZoomLevel(maxZoomLevel);
    // No centering needed here as per original structure (not hitting max zoom-out)
  } else if (newZoomLevel > minZoomLevel) { // Trying to zoom out beyond the limit (e.g., newZoomLevel is 16.0, minZoomLevel is 15.0)
    setCurrentZoomLevel(minZoomLevel);
    // Center the view ONLY when hitting the max zoom-out level by exceeding it
    setPosition({ x: 0, y: 0 }); 
  }

  // If the zoom level was already at minZoomLevel (max zoom out) before this current zoom attempt,
  // ensure it's centered. This handles cases like dragging then attempting to zoom out further.
  // Note: `currentZoomLevel` here refers to the state *before* `setCurrentZoomLevel` in this function is fully processed.
  if (currentZoomLevel === minZoomLevel) {
      setPosition({ x: 0, y: 0});
  }
};

// ... existing code ...