import { useEffect, useMemo, useState } from "react";

export default function useImageGallery(items, resetKey) {
  // Make sure the gallery always works with a clean array of valid items.
  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items]
  );

  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);

  // When the source changes completely, reset the gallery state.
  useEffect(() => {
    setPreviewImageIndex(0);
    setGalleryVisible(false);
  }, [resetKey]);

  // Keep the selected index valid if the number of gallery items changes.
  useEffect(() => {
    if (!safeItems.length) {
      setPreviewImageIndex(0);
      return;
    }

    if (previewImageIndex > safeItems.length - 1) {
      setPreviewImageIndex(0);
    }
  }, [previewImageIndex, safeItems.length]);

  const openGalleryAt = (index = 0) => {
    // Do not open the gallery if there is nothing to show.
    if (!safeItems.length) {
      return;
    }

    setPreviewImageIndex(index);
    setGalleryVisible(true);
  };

  const closeGallery = () => {
    setGalleryVisible(false);
  };

  const showPreviousItem = () => {
    // No need to move if there is only one image.
    if (safeItems.length <= 1) {
      return;
    }

    // Move back one item and loop to the end if already at the start.
    setPreviewImageIndex((current) =>
      current === 0 ? safeItems.length - 1 : current - 1
    );
  };

  const showNextItem = () => {
    // No need to move if there is only one image.
    if (safeItems.length <= 1) {
      return;
    }

    // Move forward one item and loop back to the start at the end.
    setPreviewImageIndex((current) =>
      current === safeItems.length - 1 ? 0 : current + 1
    );
  };

  return {
    galleryItems: safeItems,
    galleryVisible,
    previewImageIndex,
    selectedItem: safeItems[previewImageIndex] || null,
    setPreviewImageIndex,
    openGalleryAt,
    closeGallery,
    showPreviousItem,
    showNextItem,
  };
}