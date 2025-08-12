// src/components/SetKeysModal.jsx
import React, { useState, useEffect } from "react";
import '../styles/APIMonitorDashboard.css';

const DEFAULT_VALUES = {
  COUNTRY_CODE: "IND",
  TOURNAMENT_KEY: "a-rz--cricket--icc--icccwclt--2023-27-8JlY",
  MATCH_KEY: "a-rz--cricket--Th1834366022682058833",
  PLAYER_KEY: "c__player__jan_nicol_loftieeaton__34004",
  INNING_KEY: "a_1",
  OVER_KEY: "a_1_36",
  PAGE: 1,
  TEAM_KEY: "nep",
};

const SetKeysModal = ({ isOpen, onClose, onSave }) => {

  const [formData, setFormData] = useState(DEFAULT_VALUES);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("apiConstants");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, [isOpen]); 


  const handleReset = () => {
  setFormData(DEFAULT_VALUES);
  setErrors({});
  localStorage.setItem("apiConstants", JSON.stringify(DEFAULT_VALUES));
  if (onSave) onSave(DEFAULT_VALUES);
};


  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false })); 
  };

  const handleSave = () => {
    let newErrors = {};
    Object.keys(DEFAULT_VALUES).forEach((key) => {
      if (!formData[key] && formData[key] !== 0) {
        newErrors[key] = true;
      }
    });

    

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    localStorage.setItem("apiConstants", JSON.stringify(formData));
    if (onSave) onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>Set API Keys</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {Object.keys(DEFAULT_VALUES).map((key) => (
            <div className="form-group" key={key}>
              <label>
                {key} <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className={errors[key] ? "input-error" : ""}
              />
            </div>
          ))}

          <div className="modal-buttons">
            <button type="submit" className="save-btn">Save</button>
            <button
              type="button"
              className="cancel-btn"
              style={{ marginLeft: "8px", background: "#393e4b", color: "#fff" }}
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetKeysModal;
