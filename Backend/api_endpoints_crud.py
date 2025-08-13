# api_endpoints_crud.py
from cassandra.query import SimpleStatement
import uuid
import time

def get_all_endpoints(session):
    query = "SELECT * FROM api_endpoints"
    rows = list(session.execute(query))
    return [dict(row) for row in rows]


def add_endpoint(session, category, description, method, name, sport, url):
    unique_part = uuid.uuid4().hex[:8]
    time_part = str(int(time.time()))[-6:]
    api_key = f"api_{unique_part}{time_part}"
    query = """
        INSERT INTO api_endpoints (api_key, category, description, method, name, sport, url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    session.execute(query, (api_key, category, description, method, name, sport, url))
    return {"message": "API endpoint added successfully", "api_key": api_key}

def update_endpoint(session, api_key, category, description, method, name, sport, url):
    query = """
        UPDATE api_endpoints
        SET category=%s, description=%s, method=%s, name=%s, sport=%s, url=%s
        WHERE api_key=%s
    """
    session.execute(query, (category, description, method, name, sport, url, api_key))
    return {"message": "API endpoint updated successfully"}

def delete_endpoint(session, api_key):
    query = "DELETE FROM api_endpoints WHERE api_key=%s"
    session.execute(query, (api_key,))
    return {"message": "API endpoint deleted successfully"}


# USER CRUD OPERATIONS

def get_all_users(session):
    query = "SELECT * FROM apimonitor.user"  # Use singular 'user' table name
    try:
        rows = list(session.execute(query))
        print(f"Found {len(rows)} users")  # Debug log
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []

def add_user(session, project_key, username, api_key, role):
    try:
        # Check if project_key already exists
        check_query = "SELECT project_key FROM apimonitor.user WHERE project_key=%s"
        existing = list(session.execute(check_query, (project_key,)))
        if existing:
            return {"error": "Project key already exists"}
        
        query = """
            INSERT INTO apimonitor.user (project_key, username, api_key, role)
            VALUES (%s, %s, %s, %s)
        """
        session.execute(query, (project_key, username, api_key, role))
        return {"message": "User added successfully", "project_key": project_key}
    except Exception as e:
        print(f"Error adding user: {e}")
        return {"error": "Failed to add user"}

def update_user(session, project_key, role=None, username=None, api_key=None):
    try:
        # Build dynamic query based on what needs to be updated
        set_clauses = []
        values = []
        
        if role:
            set_clauses.append("role=%s")
            values.append(role)
        if username:
            set_clauses.append("username=%s")
            values.append(username)
        if api_key:
            set_clauses.append("api_key=%s")
            values.append(api_key)
            
        if not set_clauses:
            return {"error": "No fields to update"}
            
        values.append(project_key)
        query = f"UPDATE apimonitor.user SET {', '.join(set_clauses)} WHERE project_key=%s"
        
        session.execute(query, values)
        return {"message": "User updated successfully"}
    except Exception as e:
        print(f"Error updating user: {e}")
        return {"error": "Failed to update user"}

def delete_user(session, project_key):
    try:
        query = "DELETE FROM apimonitor.user WHERE project_key=%s"
        session.execute(query, (project_key,))
        return {"message": "User deleted successfully"}
    except Exception as e:
        print(f"Error deleting user: {e}")
        return {"error": "Failed to delete user"}