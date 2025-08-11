import requests
from cassandra.query import SimpleStatement
from datetime import datetime

BASE_URL = "https://api.sports.roanuz.com/v5/cricket/{proj_key}/"
PROJECT_KEY = "RS_P_1912493998375911425"

COUNTRY_CODE = "IND"
TOURNAMENT_KEY = "a-rz--cricket--icc--icccwclt--2023-27-8JlY"
MATCH_KEY = "a-rz--cricket--Th1834366022682058833"
PLAYER_KEY = "c__player__jan_nicol_loftieeaton__34004"
INNING_KEY = "a_1"
OVER_KEY = "a_1_36"
PAGE = 1
TEAM_KEY = "nep"

PLACEHOLDERS = {
    "{{proj_key}}": PROJECT_KEY,
    "{{project_key}}": PROJECT_KEY,
    "{{match_key}}": MATCH_KEY,
    "{{tournament_key}}": TOURNAMENT_KEY,
    "{{inning_key}}": INNING_KEY,
    "{{over_key}}": OVER_KEY,
    "{{player_key}}": PLAYER_KEY,
    "{{page}}": PAGE,
    "{{team_key}}": TEAM_KEY,
    "{{country_code}}": COUNTRY_CODE
}

def replace_placeholders(url_template: str) -> str:
    """Replace placeholders in API URL with actual values."""
    for ph, val in PLACEHOLDERS.items():
        url_template = url_template.replace(ph, str(val))
    return url_template

def test_single_api(session, project_key, api_key, auth_header):
    query = "SELECT * FROM api_endpoints WHERE api_key=%s"
    api_row = session.execute(query, [api_key]).one()
    if not api_row:
        return {'error': 'API not found'}

    headers = {"rs-token": auth_header}

    api_url = replace_placeholders(api_row['url'])
    url = BASE_URL.replace('{proj_key}', project_key) + api_url

    method = api_row['method']
    name = api_row['name']
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
        if status_code == 200:
            status = "online" if response_time <= 1000 else "slow"
    except Exception as e:
        status_code = 500
        error_message = str(e)

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
        'response_time_ms': response_time,
        'uptime': getUptime(session, project_key, api_key),
        'last_check': datetime.now().isoformat(),
        'status_code': status_code,
        'last_5_logs': last_5_logs,
        'sport': sport,
        'json_response': response_json,
        'category': category
    }

def monitor_apis(session, project_key, token):
    print("Checking API Health Now...")

    api_endpoints = session.execute("SELECT * FROM api_endpoints")
    headers = {"rs-token": token}

    data = []
    total_apis = healthy_apis = failed_apis = total_response_time = 0

    for api in api_endpoints:
        total_apis += 1
        api_url = replace_placeholders(api['url'])
        url = BASE_URL.replace('{proj_key}', project_key) + api_url

        method = api['method']
        name = api['name']
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
            if status_code == 200:
                healthy_apis += 1
                status = "online" if response_time <= 1000 else "slow"
            else:
                failed_apis += 1
        except Exception as e:
            status_code = 500
            error_message = str(e)
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
