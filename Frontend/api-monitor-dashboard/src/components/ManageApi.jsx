import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

const ManageApi = () => {
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
      .then((data) => setApis(data))
      .catch(() => {
        setMessage("Failed to fetch APIs.");
        setMessageType("error");
      });
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
      })
      .catch(() => {
        setMessage("Failed to save API.");
        setMessageType("error");
      });
  };

  const handleDelete = (apiKey) => {
    if (!window.confirm("Are you sure you want to delete this API?")) return;

    fetch(`http://127.0.0.1:5000/admin/api-endpoints/${apiKey}`, {
      method: "DELETE",
      headers: { token, role }
    })
      .then(() => {
        setMessage("API deleted successfully!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
        refreshApis();
      })
      .catch(() => {
        setMessage("Failed to delete API.");
        setMessageType("error");
      });
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

  // Pagination
  const indexLast = currentPage * apisPerPage;
  const indexFirst = indexLast - apisPerPage;
  const currentApis = filteredApis.slice(indexFirst, indexLast);

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

  const handleAddNew = () => {
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
  };

  const closeModal = () => {
    setShowModal(false);
    setEditKey(null);
  };

  return (
    <div className="api-manager">
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="api-manager-header">
        <h3>MANAGE API</h3>
        <button className="add-api-button" onClick={handleAddNew}>
          <Plus size={16} /> Add API
        </button>
      </div>

      {/* Filters */}
      <div className="filters-container" style={{ margin: "20px 0", display: "flex", gap: "15px" }}>
        <div>
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ marginLeft: "5px" }}
          >
            <option value="All">All</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Sport:</label>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            style={{ marginLeft: "5px" }}
          >
            <option value="All">All</option>
            {sports.map((sport, idx) => (
              <option key={idx} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
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
              <td>{indexFirst + index + 1}</td>
              <td>{api.api_key}</td>
              <td>{api.category}</td>
              <td>{api.name}</td>
              <td>{api.method}</td>
              <td>{api.sport}</td>
              <td>{api.url}</td>
              <td>
                <button onClick={() => handleEdit(api)} title="Edit API">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(api.api_key)} title="Delete API">
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
              <button onClick={closeModal}>
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
                <label>
                  Category <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={isOtherCategory ? "Other" : formData.category}
                  onChange={(e) => {
                    if (e.target.value === "Other") {
                      setIsOtherCategory(true);
                      setFormData({ ...formData, category: "" });
                    } else {
                      setIsOtherCategory(false);
                      setFormData({ ...formData, category: e.target.value });
                    }
                    setErrors((prev) => ({ ...prev, category: false }));
                  }}
                  className={errors.category ? "input-error" : ""}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
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
                <label>
                  Description <span style={{ color: "red" }}>*</span>
                </label>
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
                <label>
                  Method <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => {
                    setFormData({ ...formData, method: e.target.value });
                    setErrors((prev) => ({ ...prev, method: false }));
                  }}
                  className={errors.method ? "input-error" : ""}
                >
                  {["GET", "POST", "PUT", "DELETE"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>
                  Name <span style={{ color: "red" }}>*</span>
                </label>
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
                <label>
                  Sport <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => {
                    setFormData({ ...formData, sport: e.target.value });
                    setErrors((prev) => ({ ...prev, sport: false }));
                  }}
                  className={errors.sport ? "input-error" : ""}
                >
                  {["cricket", "football", "kabbadi"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL */}
              <div className="form-group">
                <label>
                  URL <span style={{ color: "red" }}>*</span>
                </label>
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
                <button type="button" className="cancel-btn" onClick={closeModal}>
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

export default ManageApi;