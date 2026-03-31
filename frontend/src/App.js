import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AddLink from "./components/AddLink";
import LinkViewer from "./components/LinkViewer";

const THEME_KEY = "dashboard-theme";
const HIDDEN_LINKS_KEY = "dashboard-hidden-link-ids";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8083/api";

function App() {
  const [links, setLinks] = useState([]);
  const [theme, setTheme] = useState("light");
  const [hiddenLinkIds, setHiddenLinkIds] = useState([]);
  const [removedLink, setRemovedLink] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
    showUndo: false,
  });
  const toastTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const initialTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    const savedHiddenLinks = localStorage.getItem(HIDDEN_LINKS_KEY);

    setTheme(initialTheme);

    if (savedHiddenLinks) {
      try {
        const parsedIds = JSON.parse(savedHiddenLinks);
        if (Array.isArray(parsedIds)) {
          setHiddenLinkIds(parsedIds);
        }
      } catch {
        setHiddenLinkIds([]);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_LINKS_KEY, JSON.stringify(hiddenLinkIds));
  }, [hiddenLinkIds]);

  const fetchLinks = async () => {
    const res = await axios.get(`${API_BASE}/links`);
    setLinks(res.data);
  };

  const removeLinkLocally = (id) => {
    setLinks((currentLinks) =>
      currentLinks.filter((currentLink) => currentLink.id !== id),
    );
    setHiddenLinkIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== id),
    );
  };

  useEffect(() => {
    const activeIds = new Set(links.map((link) => link.id));
    setHiddenLinkIds((currentIds) =>
      currentIds.filter((id) => activeIds.has(id)),
    );
  }, [links]);

  const showToast = (message, type = "info", showUndo = false) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ visible: true, message, type, showUndo });
    toastTimerRef.current = setTimeout(() => {
      setToast((currentToast) => ({ ...currentToast, visible: false }));
      setRemovedLink(null);
    }, 5000);
  };

  const handleRemove = async (link) => {
    try {
      await axios.delete(`${API_BASE}/links/${link.id}`);
      removeLinkLocally(link.id);
      setRemovedLink(link);
      showToast("Link removed", "info", true);
    } catch (error) {
      if (error?.response?.status === 404) {
        removeLinkLocally(link.id);
        showToast("Link already removed", "info");
        return;
      }

      const status = error?.response?.status;
      showToast(
        status
          ? `Failed to remove link (HTTP ${status})`
          : "Failed to remove link (backend unreachable)",
        "error",
      );
    }
  };

  const handleToggleLinkVisibility = (id) => {
    setHiddenLinkIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  };

  const handleUndo = async () => {
    if (!removedLink) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/links`, {
        url: removedLink.url,
        description: removedLink.description || "",
      });
      await fetchLinks();
      setRemovedLink(null);
      showToast("Link restored", "success");
    } catch {
      showToast("Failed to restore link", "error");
    }
  };

  const handleCopyURL = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    showToast("Copied to clipboard!", "success");
  };

  const handleClearAll = () => {
    if (links.length === 0) {
      showToast("No links to clear", "info");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete all ${links.length} link(s)? This cannot be undone.`,
      )
    ) {
      links.forEach(async (link) => {
        try {
          await axios.delete(`${API_BASE}/links/${link.id}`);
        } catch (err) {
          console.error("Error deleting link:", err);
        }
      });
      setLinks([]);
      setHiddenLinkIds([]);
      showToast(`Cleared ${links.length} link(s)`, "success");
    }
  };

  const handleExportLinks = () => {
    if (links.length === 0) {
      showToast("No links to export", "info");
      return;
    }
    const dataStr = JSON.stringify(links, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `links-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${links.length} link(s)`, "success");
  };

  const getSortedAndFilteredLinks = () => {
    let filtered = links.filter((link) =>
      link.url.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    switch (sortBy) {
      case "date-asc":
        filtered.sort((a, b) => a.id - b.id);
        break;
      case "url-asc":
        filtered.sort((a, b) => a.url.localeCompare(b.url));
        break;
      case "url-desc":
        filtered.sort((a, b) => b.url.localeCompare(a.url));
        break;
      case "date-desc":
      default:
        filtered.sort((a, b) => b.id - a.id);
    }

    return filtered;
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const hiddenLinks = links.filter((link) => hiddenLinkIds.includes(link.id));
  const openLinks = links.filter((link) => !hiddenLinkIds.includes(link.id));
  const sortedAndFiltered = getSortedAndFilteredLinks();
  const floatingNotes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        x: `${Math.round(4 + Math.random() * 90)}%`,
        y: `${Math.round(8 + Math.random() * 82)}%`,
        rotation: `${Math.round(-18 + Math.random() * 36)}deg`,
        delay: `${(Math.random() * 6).toFixed(2)}s`,
        duration: `${(8 + Math.random() * 7).toFixed(2)}s`,
        size: `${Math.round(64 + Math.random() * 40)}px`,
      })),
    [],
  );

  return (
    <div className="app-shell">
      <div className="bg-scene" aria-hidden="true">
        <div className="bg-board" />
        {floatingNotes.map((note) => (
          <div
            key={note.id}
            className="bg-note"
            style={{
              "--x": note.x,
              "--y": note.y,
              "--r": note.rotation,
              "--delay": note.delay,
              "--duration": note.duration,
              "--size": note.size,
            }}
          >
            <span className="bg-pin" />
          </div>
        ))}
      </div>

      <header className="top-bar">
        <div className="header-left">
          <h1>
            <img className="title-icon" src="/logo.png" alt="EmbedBoard logo" />
            EmbedBoard
          </h1>
          <p className="tagline">Save every tab that matters</p>
          <div className="stats-display">
            <span className="stat">📊 Total: {links.length}</span>
            <span className="stat">👁️ Open: {openLinks.length}</span>
            <span className="stat">🔒 Hidden: {hiddenLinks.length}</span>
          </div>
        </div>
        <div className="top-bar-actions">
          <button
            className="action-btn export-btn"
            onClick={handleExportLinks}
            type="button"
            title="Export links as JSON"
          >
            ⬇️ Export
          </button>
          <button
            className="action-btn clear-btn"
            onClick={handleClearAll}
            type="button"
            title="Clear all links"
          >
            🗑️ Clear All
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
            title="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {links.length > 0 && (
        <div className="controls-bar">
          <div className="search-control">
            <input
              type="text"
              placeholder="🔍 Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="sort-control">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date-desc">📅 Newest First</option>
              <option value="date-asc">📅 Oldest First</option>
              <option value="url-asc">🔤 URL (A-Z)</option>
              <option value="url-desc">🔤 URL (Z-A)</option>
            </select>
          </div>
          <div className="results-count">
            Showing {sortedAndFiltered.length} of {links.length}
          </div>
        </div>
      )}

      <div className="visibility-board">
        <div className="visibility-column">
          <h3>Open ({openLinks.length})</h3>
          <ul>
            {openLinks.map((link) => (
              <li key={`open-${link.id}`}>
                <span className="open-link-text">{link.url}</span>
                <a
                  className="open-link-anchor"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  aria-label="Open link in new tab"
                >
                  ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="visibility-column">
          <h3>Hidden ({hiddenLinks.length})</h3>
          <ul>
            {hiddenLinks.map((link, index) => (
              <li key={`hidden-${link.id}`}>Hidden link {index + 1}</li>
            ))}
          </ul>
        </div>
      </div>

      <AddLink refresh={fetchLinks} />

      <div className="link-grid">
        {sortedAndFiltered.length === 0 && links.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📎</div>
            <h2>No Links Yet</h2>
            <p>Start adding links to your dashboard using the form above.</p>
            <p className="empty-hint">
              Tip: Use the top-right actions to manage links.
            </p>
          </div>
        )}
        {sortedAndFiltered.length === 0 && links.length > 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No Results</h2>
            <p>
              No links match your search query: <strong>{searchQuery}</strong>
            </p>
            <button
              className="action-btn"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              Clear Search
            </button>
          </div>
        )}
        {sortedAndFiltered.map((link) => (
          <LinkViewer
            key={link.id}
            id={link.id}
            url={link.url}
            description={link.description || ""}
            isHidden={hiddenLinkIds.includes(link.id)}
            isCopied={copiedId === link.id}
            onToggleHidden={() => handleToggleLinkVisibility(link.id)}
            onRemove={() => handleRemove(link)}
            onCopyURL={() => handleCopyURL(link.url, link.id)}
          />
        ))}
      </div>

      {toast.visible && (
        <div
          className={`toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.message}</span>
          {toast.showUndo && removedLink && (
            <button className="toast-action" onClick={handleUndo} type="button">
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
