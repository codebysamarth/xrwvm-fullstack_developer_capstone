import os
import json
import socket
from urllib.parse import urlparse
import requests
from dotenv import load_dotenv

load_dotenv()


def _get_data_file(filename):
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'data', filename),
        os.path.join(os.getcwd(), 'server', 'database', 'data', filename),
        os.path.join(os.getcwd(), 'database', 'data', filename),
        os.path.join('/app', 'server', 'database', 'data', filename),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def _load_dealerships():
    p = _get_data_file('dealerships.json')
    if p:
        try:
            with open(p, 'r', encoding='utf-8') as f:
                return json.load(f).get('dealerships', [])
        except Exception as e:
            print(f"Error reading dealerships: {e}")
    return []


def _load_reviews():
    p = _get_data_file('reviews.json')
    if p:
        try:
            with open(p, 'r', encoding='utf-8') as f:
                return json.load(f).get('reviews', [])
        except Exception as e:
            print(f"Error reading reviews: {e}")
    return []


_in_memory_dealers = _load_dealerships()
_in_memory_reviews = _load_reviews()


def _is_url_online(url_str):
    try:
        p = urlparse(url_str)
        host = p.hostname or '127.0.0.1'
        port = p.port or (443 if p.scheme == 'https' else 80)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.08)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False


def _fallback_get(endpoint):
    endpoint = endpoint.strip()
    if endpoint == "/fetchDealers":
        return _in_memory_dealers
    if endpoint.startswith("/fetchDealers/"):
        state = endpoint.replace("/fetchDealers/", "").strip().lower()
        return [
            d for d in _in_memory_dealers
            if d.get('state', '').lower() == state or d.get('st', '').lower() == state
        ]
    if endpoint.startswith("/fetchDealer/"):
        try:
            dealer_id = int(endpoint.replace("/fetchDealer/", "").strip())
            return [d for d in _in_memory_dealers if d.get('id') == dealer_id]
        except Exception:
            return []
    if endpoint.startswith("/fetchReviews/dealer/"):
        try:
            dealer_id = int(endpoint.replace("/fetchReviews/dealer/", "").strip())
            return [r for r in _in_memory_reviews if r.get('dealership') == dealer_id]
        except Exception:
            return []
    return None


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

    backend_base = get_backend_url()
    if _is_url_online(backend_base):
        request_url = backend_base + endpoint
        if params:
            request_url = request_url + "?" + params
        print(f"GET from {request_url}")
        try:
            response = requests.get(request_url, timeout=2)
            if response.status_code == 200:
                return response.json()
        except Exception as err:
            print(f"Microservice network exception: {err}")

    return _fallback_get(endpoint)


def analyze_review_sentiments(text):
    sentiment_base = get_sentiment_analyzer_url()
    if _is_url_online(sentiment_base):
        request_url = sentiment_base + "analyze/" + text
        try:
            response = requests.get(request_url, timeout=2)
            if response.status_code == 200:
                return response.json()
        except Exception as err:
            print(f"Sentiment analyzer exception: {err}")

    try:
        from nltk.sentiment import SentimentIntensityAnalyzer
        sia = SentimentIntensityAnalyzer()
        scores = sia.polarity_scores(text)
        pos = float(scores['pos'])
        neg = float(scores['neg'])
        neu = float(scores['neu'])
        res = "positive"
        if neg > pos and neg > neu:
            res = "negative"
        elif neu > neg and neu > pos:
            res = "neutral"
        return {"sentiment": res}
    except Exception:
        lower = text.lower()
        if any(w in lower for w in ['great', 'fantastic', 'excellent', 'good', 'best', 'awesome']):
            return {"sentiment": "positive"}
        if any(w in lower for w in ['bad', 'terrible', 'worst', 'horrible', 'poor', 'awful']):
            return {"sentiment": "negative"}
        return {"sentiment": "neutral"}


def post_review(data_dict):
    backend_base = get_backend_url()
    if _is_url_online(backend_base):
        request_url = backend_base + "/insert_review"
        try:
            response = requests.post(request_url, json=data_dict, timeout=2)
            if response.status_code == 200:
                return response.json()
        except Exception as err:
            print(f"Post review network exception: {err}")

    new_id = len(_in_memory_reviews) + 1
    data_dict['id'] = new_id
    _in_memory_reviews.append(data_dict)
    return {"status": 200, "message": "Review added successfully"}
