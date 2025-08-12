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
