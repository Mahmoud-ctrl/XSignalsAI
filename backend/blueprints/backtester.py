import os
from flask import Blueprint, request, jsonify
from backtester import Backtester
import traceback

backtest_bp = Blueprint('backtest', __name__)

@backtest_bp.route('/backtest', methods=['POST'])
def run_backtest():
    try:
        data = request.json
        symbol = data.get('symbol')
        timeframe = data.get('timeframe')
        start_date = data.get('start_date', '1 year ago UTC')  # Default to Binance format
        end_date = data.get('end_date', None)
        capital = data.get('capital', 10000)
        strategies = data.get('strategies', None)  # List or None
        risk_per_trade = data.get('risk_per_trade', 0.01)

        if not symbol or not timeframe:
            return jsonify({'error': 'Missing symbol or timeframe'}), 400
        
        BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
        BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")

        tester = Backtester(
            symbol=symbol,
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            initial_capital=capital,
            risk_per_trade=risk_per_trade,
            strategies=strategies,
            api_key=BINANCE_API_KEY,
            api_secret=BINANCE_API_SECRET
        )

        metrics, trades, portfolio = tester.run_backtest()

        return jsonify({
            'metrics': metrics,
            'trades': trades,  # List of dicts
            'equity_curve': portfolio['equity'].to_list()  # For charting
        })

    except Exception as e:
        print(f"Backtest error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500