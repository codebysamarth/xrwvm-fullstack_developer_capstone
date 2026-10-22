import os
import requests
from dotenv import load_dotenv

load_dotenv()


def get_backend_url():
    url = os.getenv('backend_url', 'http://localhost:3030')
    if not url or 'your backend url' in url:
        return 'http://localhost:3030'
    return url.rstrip('/')


def get_sentiment_analyzer_url():
    url = os.getenv('sentiment_analyzer_url', 'http://localhost:5050/')
    if not url or 'your code engine' in url:
        return 'http://localhost:5050/'
    if not url.endswith('/'):
        url = url + '/'
    return url


def get_request(endpoint, **kwargs):
    params = ""
    if kwargs:
        for key, value in kwargs.items():
            params = params + key + "=" + str(value) + "&"

    request_url = get_backend_url() + endpoint
    if params:
        request_url = request_url + "?" + params

    print(f"GET from {request_url}")
    try:
        response = requests.get(request_url)
        return response.json()
    except Exception as err:
        print(f"Network exception occurred: {err}")
        return None


def analyze_review_sentiments(text):
    request_url = get_sentiment_analyzer_url() + "analyze/" + text
    try:
        response = requests.get(request_url)
        return response.json()
    except Exception as err:
        print(f"Network exception occurred: {err}")
        return None


def post_review(data_dict):
    request_url = get_backend_url() + "/insert_review"
    try:
        response = requests.post(request_url, json=data_dict)
        return response.json()
    except Exception as err:
        print(f"Network exception occurred: {err}")
        return None
