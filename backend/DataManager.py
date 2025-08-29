import os
from binance.client import Client
import pandas as pd

BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)

class DataManager:
    """Handles all data fetching and processing operations"""
    
    def __init__(self, client):
        self.client = client
        self.timeframe_map = {
            '1m': Client.KLINE_INTERVAL_1MINUTE,
            '3m': Client.KLINE_INTERVAL_3MINUTE,
            '5m': Client.KLINE_INTERVAL_5MINUTE,
            '15m': Client.KLINE_INTERVAL_15MINUTE,
            '30m': Client.KLINE_INTERVAL_30MINUTE,
            '1h': Client.KLINE_INTERVAL_1HOUR,
            '2h': Client.KLINE_INTERVAL_2HOUR,
            '4h': Client.KLINE_INTERVAL_4HOUR,
            '6h': Client.KLINE_INTERVAL_6HOUR,
            '8h': Client.KLINE_INTERVAL_8HOUR,
            '12h': Client.KLINE_INTERVAL_12HOUR,
            '1d': Client.KLINE_INTERVAL_1DAY,
            '3d': Client.KLINE_INTERVAL_3DAY,
            '1w': Client.KLINE_INTERVAL_1WEEK,
            '1M': Client.KLINE_INTERVAL_1MONTH
        }

    def get_current_price(self, symbol):
        """Get real-time current price"""
        try:
            ticker = self.client.get_ticker(symbol=symbol)
            return float(ticker['lastPrice'])
        except Exception as e:
            print(f"Error getting current price: {e}")
            return None

    def fetch_historical_data(self, symbol, interval, limit=500):
        """Fetch historical data from Binance"""
        try:
            binance_interval = self.timeframe_map.get(interval, Client.KLINE_INTERVAL_1HOUR)
            
            klines = self.client.get_klines(
                symbol=symbol, 
                interval=binance_interval, 
                limit=limit
            )
            
            if not klines:
                return None
            
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            price_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in price_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            df = df.sort_values('timestamp').reset_index(drop=True)
            df.set_index('timestamp', inplace=True)
            df = df[price_columns]
            
            return df
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None

    def get_market_context(self, symbol):
        """Get market context for the specific symbol"""
        try:
            ticker = self.client.get_ticker(symbol=symbol)
            depth = self.client.get_order_book(symbol=symbol, limit=10)
            
            best_bid = float(depth['bids'][0][0]) if depth['bids'] else 0
            best_ask = float(depth['asks'][0][0]) if depth['asks'] else 0
            spread = ((best_ask - best_bid) / best_ask * 100) if best_ask > 0 else 0
            
            return {
                'symbol': symbol,
                'current_price': float(ticker['lastPrice']),
                'price_change_24h': float(ticker['priceChangePercent']),
                'volume_24h': float(ticker['volume']),
                'high_24h': float(ticker['highPrice']),
                'low_24h': float(ticker['lowPrice']),
                'bid_ask_spread': round(spread, 4),
                'trade_count_24h': int(ticker['count'])
            }
            
        except Exception as e:
            print(f"Error getting market context: {e}")
            return None

    def calculate_24h_change(self, symbol):
        """Calculate 24h price change percentage"""
        try:
            ticker = self.client.get_ticker(symbol=symbol)
            return float(ticker['priceChangePercent'])
        except Exception as e:
            print(f"Error calculating 24h change for {symbol}: {e}")
            return 0.0