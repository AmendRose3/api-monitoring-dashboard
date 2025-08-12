import requests
from cassandra.query import SimpleStatement
from datetime import datetime

from dotenv import load_dotenv
import os

load_dotenv()

BASE_URL = os.getenv("BASE_URL")


def replace_placeholders(url_template: str, api_constants: dict) -> str:
    """Replace placeholders in API URL with actual values from api_constants."""
    mapping = {
        "{{match_key}}": api_constants.get("matchKey", ""),
        "{{tournament_key}}": api_constants.get("tournamentKey", ""),
        "{{inning_key}}": api_constants.get("inningKey", ""),
        "{{over_key}}": api_constants.get("overKey", ""),
        "{{player_key}}": api_constants.get("playerKey", ""),
        "{{page}}": api_constants.get("page", ""),
        "{{team_key}}": api_constants.get("teamKey", ""),
        "{{country_code}}": api_constants.get("countryCode", ""),
    }
    for ph, val in mapping.items():
        url_template = url_template.replace(ph, str(val))
    return url_template

def get_status_from_code(status_code):
    if status_code == 200:
        return "Success"
    elif status_code == 400:
        return "Invalid Input"
    elif status_code == 402:
        return "Inactive Project"
    elif status_code == 403:
        return "Access Limited"
    elif status_code == 404:
        return "Resource Not Found"
    elif status_code == 500:
        return "Unknown Error"
    else:
        return f"HTTP {status_code}"

def test_single_api(session, project_key, api_key, auth_header, api_constants):
    query = "SELECT * FROM api_endpoints WHERE api_key=%s"
    api_row = session.execute(query, [api_key]).one()
    if not api_row:
        return {'error': 'API not found'}

    headers = {"rs-token": auth_header}

    api_url = replace_placeholders(api_row['url'], api_constants)
    print(f"API URL after replacement: {api_url}")
    url = BASE_URL.replace('{proj_key}', project_key) + api_url
    print(f"Full URL: {url}")

    method = api_row['method']
    name = api_row['name']
    description = api_row['description']
    sport = api_row['sport']
    category = api_row['category']

    status_code = 0
    response_time = -1
    error_message = ""
    response_json = ""
    status = "offline"

    try:
        response = requests.request(method, url, headers=headers, timeout=10)
        status_code = response.status_code
        response_time = int(response.elapsed.total_seconds() * 1000)
        response_json = response.text
        status = get_status_from_code(status_code)
    except Exception as e:
        status_code = 500
        error_message = str(e)
        status = get_status_from_code(status_code)

    # Insert log
    insert_query = """
        INSERT INTO health_logs_by_api (
            project_key,
            api_key,
            log_time,
            url,
            method,
            status,
            response_time_ms,
            status_code,
            error_message,
            response_json
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    session.execute(insert_query, (
        project_key,
        api_key,
        datetime.now(),
        url,
        method,
        status,
        response_time,
        status_code,
        error_message,
        response_json
    ))

    # Get last 5 logs
    logs_query = """
        SELECT log_time, status, status_code, response_time_ms 
        FROM health_logs_by_api 
        WHERE project_key = %s AND api_key = %s 
        ORDER BY log_time DESC
        LIMIT 5
    """
    rows = session.execute(SimpleStatement(logs_query), (project_key, api_key))
    last_5_logs = [{
        'log_time': row['log_time'].isoformat(),
        'status': row['status'],
        'status_code': row['status_code'],
        'response_time_ms': row['response_time_ms'],
    } for row in rows]

    return {
        'key': api_key,
        'name': name,
        'url': url,
        'status': status,
        'description': description,
        'response_time_ms': response_time,
        'uptime': getUptime(session, project_key, api_key),
        'last_check': datetime.now().isoformat(),
        'status_code': status_code,
        'last_5_logs': last_5_logs,
        'sport': sport,
        'json_response': response_json,
        'category': category
    }

def monitor_apis(session, project_key, token,api_constants):
    print("Checking API Health Now...")

    api_endpoints = session.execute("SELECT * FROM api_endpoints")
    headers = {"rs-token": token}

    data = []
    total_apis = healthy_apis = failed_apis = total_response_time = 0

    for api in api_endpoints:
        total_apis += 1
        api_url = replace_placeholders(api['url'], api_constants)
        url = BASE_URL.replace('{proj_key}', project_key) + api_url

        method = api['method']
        name = api['name']
        description = api['description']
        sport = api['sport']
        category = api['category']

        status_code = 0
        response_time = -1
        error_message = ""
        response_json = ""
        status = "offline"

        try:
            response = requests.request(method, url, headers=headers, timeout=10)
            status_code = response.status_code
            response_time = int(response.elapsed.total_seconds() * 1000)
            response_json = response.text
            status = get_status_from_code(status_code)
            if status_code == 200:
                healthy_apis += 1
                status = "online" if response_time <= 1000 else "slow"
            else:
                failed_apis += 1
        except Exception as e:
            status_code = 500
            error_message = str(e)
            status = get_status_from_code(status_code)
            failed_apis += 1

        # Log to Cassandra
        insert_query = """
            INSERT INTO health_logs_by_api (
                project_key,
                api_key,
                log_time,
                url,
                method,
                status,
                response_time_ms,
                status_code,
                error_message,
                response_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        session.execute(insert_query, (
            project_key,
            api['api_key'],
            datetime.now(),
            url,
            method,
            status,
            response_time,
            status_code,
            error_message,
            response_json
        ))

        total_response_time += max(response_time, 0)

        # Fetch last 5 logs
        query = """
            SELECT log_time, status_code, response_time_ms 
            FROM health_logs_by_api 
            WHERE project_key = %s AND api_key = %s 
            LIMIT 5
        """
        rows = session.execute(SimpleStatement(query), (project_key, api['api_key']))
        last_5_logs = [{
            'log_time': row['log_time'].isoformat(),
            'status_code': row['status_code'],
            'response_time_ms': row['response_time_ms'],
        } for row in rows]

        data.append({
            'key': api['api_key'],
            'name': name,
            'description': description,
            'url': url,
            'status': status,
            'response_time_ms': response_time,
            'uptime': getUptime(session, project_key, api['api_key']),
            'last_check': datetime.now().isoformat(),
            'status_code': status_code,
            'last_5_logs': last_5_logs,
            'sport': sport,
            'json_response': response_json,
            'category': category
        })

    avg_response_time = total_response_time // total_apis if total_apis > 0 else 0
    return {
        'summary': {
            'total_apis': total_apis,
            'healthy_apis': healthy_apis,
            'failed_apis': failed_apis,
            'avg_response_time_ms': avg_response_time
        },
        'details': data
    }

def getUptime(session, project_key, api_key):
    try:
        query = """
            SELECT status FROM apimonitor.health_logs_by_api
            WHERE project_key = %s AND api_key = %s
            LIMIT 20
        """
        statement = SimpleStatement(query)
        rows = session.execute(statement, (project_key, api_key))
        logs = list(rows)
        if not logs:
            return "0.00%"

        online_count = sum(1 for log in logs if log['status'] == "online")
        uptime = (online_count / len(logs)) * 100
        return f"{uptime:.2f}%"
    except Exception as e:
        print(f"Error calculating uptime for API {api_key}: {e}")
        return "0.00%"
