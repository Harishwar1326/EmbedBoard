import React, { useEffect, useMemo, useState } from "react";

const PREVIEW_ENDPOINT = "http://localhost:8083/api/preview";

function buildFallbackPreview(url) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace("www.", "");
    return {
      url,
      domain,
      title: domain,
      description: "Open this link in browser",
      thumbnail: "",
      embeddable: true,
    };
  } catch {
    return {
      url,
      domain: "Unknown site",
      title: "Unknown site",
      description: "Open this link in browser",
      thumbnail: "",
      embeddable: true,
    };
  }
}

function SmartPreviewCard({
  preview,
  userDescription = "",
  isMaximized = false,
}) {
  const cardClass = isMaximized
    ? "link-preview-card link-preview-maximized"
    : "link-preview-card";

  return (
    <div className={cardClass}>
      <div className="preview-thumbnail-wrap">
        {preview.thumbnail ? (
          <img
            src={preview.thumbnail}
            alt={preview.title}
            className="preview-thumbnail"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : null}
      </div>

      <div className="preview-favicon">
        <img
          src={`https://www.google.com/s2/favicons?domain=${preview.domain}&sz=128`}
          alt="favicon"
          className="favicon-img"
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='50%' y='50%' text-anchor='middle' dy='.3em' font-size='14' fill='%23888'%3E🔗%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      <div className="preview-content">
        {userDescription ? (
          <p className="preview-user-description">{userDescription}</p>
        ) : null}
        <p className="preview-title">{preview.title || preview.domain}</p>
        <p className="preview-description">
          {preview.description || "Open this link in browser"}
        </p>
        <p className="preview-domain">{preview.domain}</p>
      </div>

      <a
        className="preview-open-btn"
        href={preview.url}
        target="_blank"
        rel="noreferrer"
        title="Open in new tab"
      >
        Open →
      </a>
    </div>
  );
}

function LinkViewer({
  url,
  description,
  onRemove,
  isHidden,
  onToggleHidden,
  onCopyURL,
  isCopied,
}) {
  const [error, setError] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [previewData, setPreviewData] = useState(buildFallbackPreview(url));
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const shouldShowPreview = useMemo(() => {
    return !isHidden && (error || !previewData.embeddable);
  }, [error, isHidden, previewData.embeddable]);

  useEffect(() => {
    let isMounted = true;
    setIsPreviewLoading(true);
    setError(false);

    fetch(`${PREVIEW_ENDPOINT}?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Preview request failed");
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setPreviewData({
            ...buildFallbackPreview(url),
            ...data,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreviewData(buildFallbackPreview(url));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  const handleRemoveClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onRemove();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const openMaximized = () => {
    setIsMaximized(true);
  };

  const closeMaximized = () => {
    setIsMaximized(false);
  };

  return (
    <>
      <div className="link-card">
        <div className="link-toolbar">
          <button
            className="maximize-link"
            onClick={openMaximized}
            type="button"
            title="Maximize view"
          >
            ⛶
          </button>
          {isHidden ? (
            <button
              className="open-link open-link-locked"
              type="button"
              disabled
              title="Unhide to open"
              aria-label="Link is locked while hidden"
            >
              Locked
            </button>
          ) : (
            <a
              className="open-link"
              href={url}
              target="_blank"
              rel="noreferrer"
              title="Open link"
              aria-label="Open link in new tab"
            >
              ↗
            </a>
          )}
          <button
            className="copy-link"
            onClick={onCopyURL}
            type="button"
            title={isCopied ? "Copied!" : "Copy URL"}
          >
            {isCopied ? "✓" : "📋"}
          </button>
          <button
            className="hide-link"
            onClick={onToggleHidden}
            type="button"
            title={isHidden ? "Unhide link" : "Hide link"}
          >
            {isHidden ? "👁️" : "🔒"}
          </button>
          <button
            className="remove-link"
            onClick={handleRemoveClick}
            type="button"
            title="Remove link"
          >
            ✕
          </button>
        </div>
        {description ? <p className="link-description">{description}</p> : null}
        <div
          className={`link-content ${shouldShowPreview ? "preview-container" : ""}`.trim()}
        >
          {isHidden ? (
            <div className="privacy-placeholder">
              Links are hidden for privacy
            </div>
          ) : isPreviewLoading ? (
            <div className="preview-loading">Loading preview...</div>
          ) : shouldShowPreview ? (
            <SmartPreviewCard
              preview={previewData}
              userDescription={description}
            />
          ) : (
            <iframe
              className="link-frame"
              src={url}
              width="100%"
              height="100%"
              onError={() => setError(true)}
              title="embed"
            />
          )}
        </div>
      </div>

      {isMaximized && (
        <div className="maximized-overlay">
          <div className="maximized-header">
            <span className="maximized-url" title={isHidden ? "Hidden" : url}>
              {isHidden ? "Hidden for privacy" : url}
            </span>
            <button
              className="close-maximized"
              onClick={closeMaximized}
              type="button"
            >
              Close
            </button>
          </div>
          <div
            className={`maximized-body ${shouldShowPreview ? "preview-container" : ""}`.trim()}
          >
            {isHidden ? (
              <div className="privacy-placeholder">
                Links are hidden for privacy
              </div>
            ) : isPreviewLoading ? (
              <div className="preview-loading">Loading preview...</div>
            ) : shouldShowPreview ? (
              <SmartPreviewCard
                preview={previewData}
                userDescription={description}
                isMaximized
              />
            ) : (
              <iframe
                className="link-frame"
                src={url}
                width="100%"
                height="100%"
                onError={() => setError(true)}
                title="embed-maximized"
              />
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <span className="delete-modal-icon">⚠️</span>
              <h2>Delete Link?</h2>
            </div>
            <p className="delete-modal-message">
              Are you sure you want to remove this link? This action cannot be
              undone.
            </p>
            <p className="delete-modal-url">
              {url.slice(0, 80)}
              {url.length > 80 ? "..." : ""}
            </p>
            <div className="delete-modal-actions">
              <button
                className="delete-modal-cancel"
                onClick={cancelDelete}
                type="button"
              >
                Cancel
              </button>
              <button
                className="delete-modal-confirm"
                onClick={confirmDelete}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LinkViewer;
