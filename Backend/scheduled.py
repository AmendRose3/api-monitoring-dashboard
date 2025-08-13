import logging
from cassandra_db import get_cassandra_session
import requests
import time
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

PROJECT_KEY = "RS_P_1912493998375911425"
API_KEY = "RS5:Y11912493998375911426"
BASE_URL="https://api.sports.roanuz.com/v5/cricket/{proj_key}/"

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
# Globals for token caching
current_token = None
token_expiry = 0  # Unix timestamp

session = get_cassandra_session()

def fetch_roanuz_token():
    """Fetch a fresh token from Roanuz API and update globals."""
    global current_token, token_expiry
    try:
        auth_url = f"https://api.sports.roanuz.com/v5/core/{PROJECT_KEY}/auth/"
        response = requests.post(auth_url, json={"api_key": API_KEY}, timeout=10)
        if response.status_code != 200:
            logging.error("Authentication failed with Roanuz API")
            return None
        data = response.json().get("data", {})
        token = data.get("token")
        expires = data.get("expires")

        if not token or not expires:
            logging.error("Invalid token or expiry from Roanuz API")
            return None

        current_token = token
        token_expiry = expires
        logging.info(f"Fetched new token, expires at {datetime.fromtimestamp(token_expiry)}")
        return token
    except Exception as e:
        logging.error(f"Auth API error: {str(e)}")
        return None

def get_token():
    """Return valid token, fetch new one if expired (with 60 sec buffer)."""
    global current_token, token_expiry
    now = time.time()
    if not current_token or now >= (token_expiry - 60):  # Refresh 1 min before expiry
        logging.info("Token expired/missing, fetching new token...")
        return fetch_roanuz_token()
    return current_token

def monitor_apis(session, project_key):
    """Checks health of monitored APIs and logs results to Cassandra."""
    logging.info("Checking API Health...")
    token = get_token()
    if not token:
        logging.error("Skipping monitoring - could not get token")
        return

    monitored_apis = session.execute("SELECT * FROM api_endpoints")

    total_apis = 0
    healthy_apis = 0
    failed_apis = 0
    total_response_time = 0

    headers = {"rs-token": token}

    for api in monitored_apis:
        total_apis += 1
        api_url = api['url']
        method = api['method']

        for ph, val in PLACEHOLDERS.items():
            api_url = api_url.replace(ph, str(val))

        url = BASE_URL.replace("{proj_key}", PROJECT_KEY) + api_url

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

        # Save log to Cassandra
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

            


        # -----------

    avg_response_time = total_response_time // total_apis if total_apis > 0 else 0
    logging.info(f"Summary: {healthy_apis} healthy, {failed_apis} failed, Avg RT: {avg_response_time} ms")

def scheduled_monitoring_job():
    """Runs monitoring every 30 min with cached token."""
    monitor_apis(session, PROJECT_KEY)
    logging.info("Scheduled monitoring complete")

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=scheduled_monitoring_job,
        trigger=IntervalTrigger(minutes=30),
        # trigger=IntervalTrigger(seconds=30),
        id='api_monitoring_job',
        name='Monitor APIs every 30 minutes',
        replace_existing=True
    )
    scheduler.start()
    logging.info("Scheduler started. Monitoring will run every 30 minutes.")

    # Run once at startup
    scheduled_monitoring_job()

    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logging.info("Scheduler stopped.")
