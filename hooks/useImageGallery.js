import { useEffect, useMemo, useState } from "react";

export default function useImageGallery(items, resetKey) {
  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items]
  );

  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);

  useEffect(() => {
    setPreviewImageIndex(0);
    setGalleryVisible(false);
  }, [resetKey]);

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
    if (safeItems.length <= 1) {
      return;
    }

    setPreviewImageIndex((current) =>
      current === 0 ? safeItems.length - 1 : current - 1
    );
  };

  const showNextItem = () => {
    if (safeItems.length <= 1) {
      return;
    }

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