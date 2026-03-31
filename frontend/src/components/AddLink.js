import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8083/api";

function AddLink({ refresh }) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) {
      return;
    }

    await axios.post(`${API_BASE}/links`, {
      url,
      description: description.trim(),
    });
    setUrl("");
    setDescription("");
    refresh();
  };

  return (
    <div className="link-form">
      <input
        className="link-input"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste link..."
      />
      <input
        className="link-input link-input-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add description about this tab..."
      />
      <button className="link-submit" onClick={handleSubmit} type="button">
        Add
      </button>
    </div>
  );
}

export default AddLink;
