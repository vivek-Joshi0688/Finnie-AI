
import requests


AlphaVantage_API_KEY="XLDAEOJBVO3EY7KU"
symbol="TCS.BSE"
try:   
    url=f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={AlphaVantage_API_KEY}"
    response = requests.get(url)
    data = response.json()

    print(data)

    time_series = data.get("Time Series (Daily)")
except Exception as e:
    print(f"Error fetching stock data for {symbol}: {str(e)}")
