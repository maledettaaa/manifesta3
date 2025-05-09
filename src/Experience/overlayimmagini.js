{/* Render image grid only when no image is in full-screen mode */}
{(!selectedImage || showInfoWindow) && imagesData.map((image, index) => (
    <ImagePlane
      key={image.id}
      id={image.id}
      path={image.path}
      position={planePositions[index]}
      onClick={handleImageClick}
    />
  ))}