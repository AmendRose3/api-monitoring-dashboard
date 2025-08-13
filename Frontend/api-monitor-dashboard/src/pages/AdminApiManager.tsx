import React, { useState } from "react";
import "../styles/AdminApiManager.css";
import "../styles/APIMonitorDashboard.css";
import Header from "../components/AdminHeader.js";
import ManageApi from "../components/ManageApi.js";
import ManageUser from "../components/ManageUser.js";

const AdminApiManager = () => {
  const [view, setView] = useState("api"); // 'api' or 'user'
  const role = localStorage.getItem("role");


  if (role !== "admin") {
    return (
      <div className="unauthorized-access">
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-manager">
      <Header />
      
      {/* View Switch Buttons */}
      <div className="view-switcher" style={{ margin: "20px 0", textAlign: "center" }}>
        <button
          onClick={() => setView("api")}
          disabled={view === "api"}
          className={`view-switch-buttons ${view === "api" ? "active" : ""}`}
        >
          Manage API
        </button>
        <button 
          onClick={() => setView("user")} 
          disabled={view === "user"} 
          className={`view-switch-buttons ${view === "user" ? "active" : ""}`}
        >
          Manage Users
        </button>
      </div>

      {/* Render the appropriate component based on view */}
      {view === "api" ? <ManageApi /> : <ManageUser />}
    </div>
  );
};

export default AdminApiManager;