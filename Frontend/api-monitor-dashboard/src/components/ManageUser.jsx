import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_key: "",
    username: "",
    api_key: "",
    role: ""
  });
  const [errors, setErrors] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    fetch("http://127.0.0.1:5000/admin/users", {
      headers: { token, role }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched users:", data); // Debug log
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setMessage("Failed to fetch users.");
        setMessageType("error");
      });
  };

  const handleSubmit = () => {
    let newErrors = {};
    const requiredFields = ["project_key", "username", "api_key", "role"];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const method = editKey ? "PUT" : "POST";
    const endpoint = editKey
      ? `http://127.0.0.1:5000/admin/users/${editKey}`
      : "http://127.0.0.1:5000/admin/users";

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
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
          setMessageType("error");
        } else {
          setMessage(editKey ? "User updated successfully!" : "User added successfully!");
          setMessageType("success");
          setTimeout(() => setMessage(""), 3000);

          setFormData({
            project_key: "",
            username: "",
            api_key: "",
            role: ""
          });
          setEditKey(null);
          setErrors({});
          setShowModal(false);
          refreshUsers();
        }
      })
      .catch(() => {
        setMessage("Failed to save user.");
        setMessageType("error");
      });
  };

  const handleDelete = (projectKey) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    fetch(`http://127.0.0.1:5000/admin/users/${projectKey}`, {
      method: "DELETE",
      headers: { token, role }
    })
      .then(() => {
        setMessage("User deleted successfully!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
        refreshUsers();
      })
      .catch(() => {
        setMessage("Failed to delete user.");
        setMessageType("error");
      });
  };

  const handleEdit = (user) => {
    setFormData({
      project_key: user.project_key,
      username: user.username,
      api_key: user.api_key,
      role: user.role
    });
    setEditKey(user.project_key);
    setErrors({});
    setShowModal(true);
  };

  // Pagination
  const indexLast = currentPage * usersPerPage;
  const indexFirst = indexLast - usersPerPage;
  const currentUsers = users.slice(indexFirst, indexLast);

  const nextPage = () => {
    if (currentPage < Math.ceil(users.length / usersPerPage)) {
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
      project_key: "",
      username: "",
      api_key: "",
      role: ""
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditKey(null);
  };

  return (
    <div className="user-manager">
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="api-manager-header">
        <h3>MANAGE USERS</h3>
        <button className="add-api-button" onClick={handleAddNew}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <table className="api-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Project Key</th>
            <th>Username</th>
            <th>API Key</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={user.project_key}>
              <td>{indexFirst + index + 1}</td>
              <td>{user.project_key}</td>
              <td>{user.username}</td>
              <td>{user.api_key}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleEdit(user)} title="Edit User">
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(user.project_key)} 
                  title="Delete User"
                >
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
          Page {currentPage} of {Math.ceil(users.length / usersPerPage)}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(users.length / usersPerPage)}
        >
          Next
        </button>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editKey ? "Update User" : "Add User"}</h2>
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
              {/* Project Key */}
              <div className="form-group">
                <label>
                  Project Key <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Project Key"
                  value={formData.project_key}
                  onChange={(e) => {
                    setFormData({ ...formData, project_key: e.target.value });
                    setErrors((prev) => ({ ...prev, project_key: false }));
                  }}
                  className={errors.project_key ? "input-error" : ""}
                //   disabled={editKey !== null} // disable editing project_key on update
                />
              </div>

              {/* Username */}
              <div className="form-group">
                <label>
                  Username <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setErrors((prev) => ({ ...prev, username: false }));
                  }}
                  className={errors.username ? "input-error" : ""}
                />
              </div>

              {/* API Key */}
              <div className="form-group">
                <label>
                  API Key <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="API Key"
                  value={formData.api_key}
                  onChange={(e) => {
                    setFormData({ ...formData, api_key: e.target.value });
                    setErrors((prev) => ({ ...prev, api_key: false }));
                  }}
                  className={errors.api_key ? "input-error" : ""}
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label>
                  Role <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    setErrors((prev) => ({ ...prev, role: false }));
                  }}
                  className={errors.role ? "input-error" : ""}
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
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

export default ManageUser;