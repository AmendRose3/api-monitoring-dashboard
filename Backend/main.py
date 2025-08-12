from flask import Flask, jsonify
from flask_cors import CORS
from cassandra_db import get_cassandra_session
from monitor import monitor_apis,test_single_api
from api_endpoints_crud import get_all_endpoints, add_endpoint, update_endpoint, delete_endpoint
import requests
from flask import request

app = Flask(__name__)
CORS(app, supports_credentials=True, allow_headers=[
    "Content-Type",
    "Authorization",
    "token",
    "key",
    "role",
    "countryCode",
    "tournamentKey",
    "matchKey",
    "playerKey",
    "inningKey",
    "overKey",
    "page",
    "teamKey"
])

session = get_cassandra_session()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    project_key = data.get('project_key')
    api_key = data.get('api_key')
    role = data.get('role')

    if not project_key or not api_key or not role:
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        auth_url = f"https://api.sports.roanuz.com/v5/core/{project_key}/auth/"
        response = requests.post(auth_url, json={"api_key": api_key}, timeout=10)
        if response.status_code != 200:
            return jsonify({'error': 'Authentication failed with Roanuz API'}), 401
        
        token = response.json().get("data", {}).get("token")
        if not token:
            return jsonify({'error': 'Invalid token received'}), 401
    except Exception as e:
        return jsonify({'error': f'Auth API error: {str(e)}'}), 500

    try:
        query = "SELECT role FROM user WHERE project_key=%s"
        result = session.execute(query, [project_key]).one()
        if result is None or result.get('role') != role:
            return jsonify({'error': 'User not found or role mismatch'}), 403
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    return jsonify({'token': token}), 200


# TEST SINGLE API

@app.route('/monitor/test/<api_key>', methods=['GET'])
def hit_single_api(api_key):
    auth_header = request.headers.get('token')
    project_key = request.headers.get('key')
    role = request.headers.get('role')
    api_constants = get_api_constants_from_headers(request)


    if not auth_header or not project_key or not role:
        return jsonify({'error': 'Missing auth headers'}), 400

    token = auth_header

    try:
        result = test_single_api(session, project_key,api_key, auth_header,api_constants)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Error testing API: {str(e)}'}), 500



# GET DATA 
@app.route('/monitor', methods=['GET'])
def monitor():
    auth_header = request.headers.get('token')
    project_key = request.headers.get('key')
    role = request.headers.get('role')
    api_constants = get_api_constants_from_headers(request)
    print(f"API Constants: {api_constants}")


    
    if not auth_header or not project_key or not role:
        return jsonify({'error': 'Missing auth headers bro'}), 400
    token = auth_header
    result = monitor_apis(session, project_key, token,api_constants)
    return jsonify(result)


# CRUD OPERATIONS FOR API ENDPOINTS


@app.route('/admin/api-endpoints', methods=['GET'])
def list_endpoints():
    print("Fetching all API endpoints")
    role = request.headers.get('role')
    if role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(get_all_endpoints(session)), 200

@app.route('/admin/api-endpoints', methods=['POST'])
def create_endpoint():
    role = request.headers.get('role')
    if role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    return jsonify(add_endpoint(session, **data)), 201

@app.route('/admin/api-endpoints/<api_key>', methods=['PUT'])
def edit_endpoint(api_key):
    role = request.headers.get('role')
    if role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    data.pop("api_key", None)
    return jsonify(update_endpoint(session, api_key, **data)), 200

@app.route('/admin/api-endpoints/<api_key>', methods=['DELETE'])
def remove_endpoint(api_key):
    role = request.headers.get('role')
    if role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(delete_endpoint(session, api_key)), 200


#Helper function to extract API constants from request headers

def get_api_constants_from_headers(req):
    """Extract optional API constants from request headers."""
    print(f"Request Headers: {req.headers}")
    possible_keys = [
        "countryCode",
        "tournamentKey",
        "matchKey",
        "playerKey",
        "inningKey",
        "overKey",
        "page",
        "teamKey",
    ]
    return {k: req.headers.get(k) for k in possible_keys if req.headers.get(k) is not None}

if __name__ == '__main__':
    app.run(debug=True)
