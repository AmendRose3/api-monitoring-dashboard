import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import "../styles/AdminApiManager.css";
import "../styles/APIMonitorDashboard.css";
import Header from "../components/AdminHeader";

const AdminApiManager = () => {
  const [apis, setApis] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    method: "GET",
    name: "",
    sport: "cricket",
    url: ""
  });
  const [errors, setErrors] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const apisPerPage = 10;

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sportFilter, setSportFilter] = useState("All");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    refreshApis();
  }, []);

  const refreshApis = () => {
    fetch("http://127.0.0.1:5000/admin/api-endpoints", {
      headers: { token, role }
    })
      .then((res) => res.json())
      .then((data) => setApis(data));
  };

  const handleSubmit = () => {
    let newErrors = {};
    const requiredFields = ["category", "description", "method", "name", "sport", "url"];

    requiredFields.forEach((field) => {
      if (!formData[field] && formData[field] !== 0) {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const method = editKey ? "PUT" : "POST";
    const endpoint = editKey
      ? `http://127.0.0.1:5000/admin/api-endpoints/${editKey}`
      : "http://127.0.0.1:5000/admin/api-endpoints";

    fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        token,
        role
      },
      body: JSON.stringify(formData)
    })
      .then((res) => res.json())
      .then(() => {

        setMessage(editKey ? "API updated successfully!" : "API added successfully!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);

        setFormData({
          category: "",
          description: "",
          method: "GET",
          name: "",
          sport: "cricket",
          url: ""
        });
        setEditKey(null);
        setErrors({});
        setShowModal(false);
        refreshApis();
      });
  };

  const handleDelete = (apiKey) => {
    fetch(`http://127.0.0.1:5000/admin/api-endpoints/${apiKey}`, {
      method: "DELETE",
      headers: { token, role }
    }).then(() => {
        setMessage("API deleted  successfully!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      refreshApis()});
  };

  const handleEdit = (api) => {
    setFormData(api);
    setEditKey(api.api_key);
    setIsOtherCategory(!categories.includes(api.category));
    setErrors({});
    setShowModal(true);
  };

  const categories = useMemo(() => {
    if (!apis.length) return [];
    return [...new Set(apis.map((api) => api.category || "Uncategorized"))];
  }, [apis]);

  const sports = useMemo(() => {
    if (!apis.length) return [];
    return [...new Set(apis.map((api) => api.sport || "Unknown"))];
  }, [apis]);

  const filteredApis = useMemo(() => {
    return apis.filter((api) => {
      if (categoryFilter !== "All" && (api.category || "Uncategorized") !== categoryFilter) {
        return false;
      }
      if (sportFilter !== "All" && (api.sport || "Unknown") !== sportFilter) {
        return false;
      }
      return true;
    });
  }, [apis, categoryFilter, sportFilter]);

  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = filteredApis.slice(indexOfFirstApi, indexOfLastApi);

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredApis.length / apisPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleCategoryChange = (value) => {
    if (value === "Other") {
      setIsOtherCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setIsOtherCategory(false);
      setFormData({ ...formData, category: value });
    }
    setErrors((prev) => ({ ...prev, category: false }));
  };

  if (role !== "admin") {
    return <div>You are not authorized to view this page.</div>;
  }

  return (
    <div className="api-manager">
      <Header />
      {message && (
          <div className={`message ${messageType}`}>
              {message}
          </div>
      )}
      <div className="api-manager-header">
        <h3>MANAGE API</h3>
        <button
          className="add-api-button"
          onClick={() => {
            setEditKey(null);
            setFormData({
              category: "",
              description: "",
              method: "GET",
              name: "",
              sport: "cricket",
              url: ""
            });
            setIsOtherCategory(false);
            setErrors({});
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Add API
        </button>
      </div>

      <table className="api-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>API Key</th>
            <th>Category</th>
            <th>Name</th>
            <th>Method</th>
            <th>Sport</th>
            <th>URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentApis.map((api, index) => (
            <tr key={api.api_key}>
              <td>{indexOfFirstApi + index + 1}</td>
              <td>{api.api_key}</td>
              <td>{api.category}</td>
              <td>{api.name}</td>
              <td>{api.method}</td>
              <td>{api.sport}</td>
              <td>{api.url}</td>
              <td>
                <button onClick={() => handleEdit(api)}>
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(api.api_key)}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={prevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {Math.ceil(filteredApis.length / apisPerPage)}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(filteredApis.length / apisPerPage)}
        >
          Next
        </button>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editKey ? "Update API" : "Add API"}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditKey(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {/* Category */}
              <div className="form-group">
                <label>Category <span style={{ color: "red" }}>*</span></label>
                <select
                  value={isOtherCategory ? "Other" : formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={errors.category ? "input-error" : ""}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {isOtherCategory && (
                  <input
                    placeholder="Enter new category"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      setErrors((prev) => ({ ...prev, category: false }));
                    }}
                    className={errors.category ? "input-error" : ""}
                  />
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description <span style={{ color: "red" }}>*</span></label>
                <input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setErrors((prev) => ({ ...prev, description: false }));
                  }}
                  className={errors.description ? "input-error" : ""}
                />
              </div>

              {/* Method */}
              <div className="form-group">
                <label>Method <span style={{ color: "red" }}>*</span></label>
                <select
                  value={formData.method}
                  onChange={(e) => {
                    setFormData({ ...formData, method: e.target.value });
                    setErrors((prev) => ({ ...prev, method: false }));
                  }}
                  className={errors.method ? "input-error" : ""}
                >
                  {["GET", "POST", "PUT", "DELETE"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>Name <span style={{ color: "red" }}>*</span></label>
                <input
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: false }));
                  }}
                  className={errors.name ? "input-error" : ""}
                />
              </div>

              {/* Sport */}
              <div className="form-group">
                <label>Sport <span style={{ color: "red" }}>*</span></label>
                <select
                  value={formData.sport}
                  onChange={(e) => {
                    setFormData({ ...formData, sport: e.target.value });
                    setErrors((prev) => ({ ...prev, sport: false }));
                  }}
                  className={errors.sport ? "input-error" : ""}
                >
                  {["cricket", "football", "kabbadi"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* URL */}
              <div className="form-group">
                <label>URL <span style={{ color: "red" }}>*</span></label>
                <input
                  placeholder="URL"
                  value={formData.url}
                  onChange={(e) => {
                    setFormData({ ...formData, url: e.target.value });
                    setErrors((prev) => ({ ...prev, url: false }));
                  }}
                  className={errors.url ? "input-error" : ""}
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  {editKey ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditKey(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default AdminApiManager;
