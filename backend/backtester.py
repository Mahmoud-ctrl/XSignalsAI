# enhanced_backtester.py - Enhanced Backtester with Better Signal Processing

import pandas as pd
import numpy as np
from binance.client import Client
import os
from indicators import compute_indicators
from strategies import TradingStrategies
import traceback

class Backtester:
    def __init__(self, symbol, timeframe, start_date, end_date, initial_capital=10000, 
                 risk_per_trade=0.02, strategies=None, api_key=None, api_secret=None):
        """
        Enhanced backtester with improved signal processing and risk management.
        
        Parameters:
        - risk_per_trade: Increased default to 2% for more aggressive trading
        - Better signal filtering and position management
        """
        self.symbol = symbol.upper()
        self.timeframe = timeframe
        self.start_date = start_date
        self.end_date = end_date
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.risk_per_trade = risk_per_trade
        self.strategies = strategies or ['all']
        self.client = Client(api_key or os.getenv('BINANCE_API_KEY'), api_secret or os.getenv('BINANCE_API_SECRET'))
        self.df = None
        self.indicators_df = None
        self.signals_df = None
        self.trades = []
        self.portfolio = pd.DataFrame()
        
        # Enhanced parameters
        self.min_signal_strength = 0.6  # Minimum signal strength to enter trades
        self.max_positions = 3  # Maximum concurrent positions
        self.trailing_stop_pct = 0.05  # 5% trailing stop
        self.take_profit_ratio = 2.5  # Take profit at 2.5:1 R:R

    def fetch_data(self):
        """Fetch historical data from Binance"""
        try:
            klines = self.client.get_historical_klines(
                self.symbol,
                self.timeframe,
                self.start_date,
                self.end_date
            )
            self.df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'], unit='ms')
            self.df.set_index('timestamp', inplace=True)
            self.df = self.df[['open', 'high', 'low', 'close', 'volume']].astype(float)
            print(f"Fetched {len(self.df)} bars for {self.symbol} {self.timeframe}")
        except Exception as e:
            print(f"Error fetching data: {e}")
            traceback.print_exc()
            raise

    def compute_indicators_and_strategies(self, btc_df=None):
        """Compute indicators and run strategies"""
        try:
            _, _, self.indicators_df = compute_indicators(self.df, btc_df)
            if self.indicators_df is None:
                raise ValueError("Failed to compute indicators")

            # Use strategies
            strategy_system = TradingStrategies(self.df, self.indicators_df)
            results = strategy_system.run_all_strategies()
            self.signals_df = results['signals_df']
            
            # Store strategy results for analysis
            self.strategy_results = results
            
        except Exception as e:
            print(f"Error computing indicators/strategies: {e}")
            traceback.print_exc()
            raise

    def calculate_position_size(self, entry_price, stop_loss, risk_amount):
        """Calculate position size based on risk management"""
        if stop_loss == 0 or entry_price == stop_loss:
            return 0
        
        risk_per_unit = abs(entry_price - stop_loss)
        position_size = risk_amount / risk_per_unit
        
        # Don't risk more than 50% of capital on a single trade
        max_position_value = self.current_capital * 0.5
        max_shares = max_position_value / entry_price
        
        return min(position_size, max_shares)

    def get_signal_strength(self, signals_row):
        """Calculate signal strength based on number and quality of signals"""
        buy_cols = [col for col in signals_row.index if '_buy' in col and signals_row[col]]
        sell_cols = [col for col in signals_row.index if '_sell' in col and signals_row[col] and 'exit' not in col]
        
        # Enhanced strategies get higher weight
        enhanced_strategies = ['scalping_ema', 'rsi_mean_rev', 'momentum_break', 'stoch_div', 
                             'multi_rsi', 'wr_pullback', 'adaptive_bb', 'macd_hist', 'vpa']
        
        buy_strength = 0
        sell_strength = 0
        
        for col in buy_cols:
            weight = 1.5 if any(strategy in col for strategy in enhanced_strategies) else 1.0
            buy_strength += weight
            
        for col in sell_cols:
            weight = 1.5 if any(strategy in col for strategy in enhanced_strategies) else 1.0
            sell_strength += weight
        
        # Normalize strength (max possible is around 15 for enhanced strategies)
        max_possible = 15
        buy_strength = min(buy_strength / max_possible, 1.0)
        sell_strength = min(sell_strength / max_possible, 1.0)
        
        return buy_strength, sell_strength

    def simulate_trades(self):
        """Enhanced trade simulation with better signal processing"""
        if self.signals_df is None:
            raise ValueError("Signals not computed")

        # Merge data
        sim_df = pd.concat([self.df, self.indicators_df['atr_14'], self.signals_df], axis=1)
        sim_df.dropna(inplace=True)

        positions = {}  # {strategy_id: position_info}
        equity = [self.initial_capital]
        position_counter = 0

        for idx, row in sim_df.iterrows():
            current_price = row['close']
            atr = row['atr_14']
            
            # Update trailing stops and check exits
            positions_to_remove = []
            for pos_id, pos in positions.items():
                profit_loss = 0
                exit_reason = ""
                
                if pos['direction'] == 'long':
                    # Update trailing stop
                    if current_price > pos['highest_price']:
                        pos['highest_price'] = current_price
                        new_trailing_stop = current_price * (1 - self.trailing_stop_pct)
                        pos['stop_loss'] = max(pos['stop_loss'], new_trailing_stop)
                    
                    # Check exits
                    if current_price <= pos['stop_loss']:
                        exit_price = pos['stop_loss']
                        profit_loss = (exit_price - pos['entry_price']) * pos['quantity']
                        exit_reason = 'stop_loss'
                    elif current_price >= pos['take_profit']:
                        exit_price = pos['take_profit']
                        profit_loss = (exit_price - pos['entry_price']) * pos['quantity']
                        exit_reason = 'take_profit'
                        
                elif pos['direction'] == 'short':
                    # Update trailing stop for short
                    if current_price < pos['lowest_price']:
                        pos['lowest_price'] = current_price
                        new_trailing_stop = current_price * (1 + self.trailing_stop_pct)
                        pos['stop_loss'] = min(pos['stop_loss'], new_trailing_stop)
                    
                    # Check exits
                    if current_price >= pos['stop_loss']:
                        exit_price = pos['stop_loss']
                        profit_loss = (pos['entry_price'] - exit_price) * pos['quantity']
                        exit_reason = 'stop_loss'
                    elif current_price <= pos['take_profit']:
                        exit_price = pos['take_profit']
                        profit_loss = (pos['entry_price'] - exit_price) * pos['quantity']
                        exit_reason = 'take_profit'
                
                if exit_reason:
                    self.current_capital += profit_loss
                    self.trades.append({
                        'strategy': pos['strategy'],
                        'entry_date': pos['entry_date'],
                        'exit_date': idx,
                        'entry_price': pos['entry_price'],
                        'exit_price': exit_price,
                        'quantity': pos['quantity'],
                        'profit': profit_loss,
                        'type': f"{pos['direction']}_{exit_reason}",
                        'signal_strength': pos['signal_strength']
                    })
                    positions_to_remove.append(pos_id)
            
            # Remove closed positions
            for pos_id in positions_to_remove:
                del positions[pos_id]

            # Check for new signals if we have room for more positions
            if len(positions) < self.max_positions:
                buy_strength, sell_strength = self.get_signal_strength(row)
                
                # Enter long positions
                if buy_strength >= self.min_signal_strength:
                    risk_amount = self.current_capital * self.risk_per_trade
                    stop_distance = atr * 2
                    stop_loss = current_price - stop_distance
                    take_profit = current_price + (stop_distance * self.take_profit_ratio)
                    
                    quantity = self.calculate_position_size(current_price, stop_loss, risk_amount)
                    
                    if quantity > 0:
                        position_counter += 1
                        positions[f'long_{position_counter}'] = {
                            'strategy': f'enhanced_long_{buy_strength:.2f}',
                            'entry_price': current_price,
                            'stop_loss': stop_loss,
                            'take_profit': take_profit,
                            'quantity': quantity,
                            'direction': 'long',
                            'entry_date': idx,
                            'highest_price': current_price,
                            'signal_strength': buy_strength
                        }
                
                # Enter short positions
                elif sell_strength >= self.min_signal_strength:
                    risk_amount = self.current_capital * self.risk_per_trade
                    stop_distance = atr * 2
                    stop_loss = current_price + stop_distance
                    take_profit = current_price - (stop_distance * self.take_profit_ratio)
                    
                    quantity = self.calculate_position_size(current_price, stop_loss, risk_amount)
                    
                    if quantity > 0:
                        position_counter += 1
                        positions[f'short_{position_counter}'] = {
                            'strategy': f'enhanced_short_{sell_strength:.2f}',
                            'entry_price': current_price,
                            'stop_loss': stop_loss,
                            'take_profit': take_profit,
                            'quantity': quantity,
                            'direction': 'short',
                            'entry_date': idx,
                            'lowest_price': current_price,
                            'signal_strength': sell_strength
                        }

            # Update equity curve
            open_profit = 0
            for pos in positions.values():
                if pos['direction'] == 'long':
                    open_profit += (current_price - pos['entry_price']) * pos['quantity']
                else:
                    open_profit += (pos['entry_price'] - current_price) * pos['quantity']
            
            equity.append(self.current_capital + sum(t['profit'] for t in self.trades) + open_profit)

        # Close any remaining positions at the end
        if positions:
            final_price = sim_df['close'].iloc[-1]
            for pos in positions.values():
                if pos['direction'] == 'long':
                    profit = (final_price - pos['entry_price']) * pos['quantity']
                else:
                    profit = (pos['entry_price'] - final_price) * pos['quantity']
                
                self.current_capital += profit
                self.trades.append({
                    'strategy': pos['strategy'],
                    'entry_date': pos['entry_date'],
                    'exit_date': sim_df.index[-1],
                    'entry_price': pos['entry_price'],
                    'exit_price': final_price,
                    'quantity': pos['quantity'],
                    'profit': profit,
                    'type': f"{pos['direction']}_final_close",
                    'signal_strength': pos['signal_strength']
                })

        self.portfolio = pd.DataFrame({'equity': equity}, 
                                    index=[self.df.index[0] - pd.Timedelta(days=1)] + sim_df.index.tolist())

    def get_performance_metrics(self):
        """Calculate enhanced performance metrics"""
        if not self.trades:
            return {
                'total_profit': 0, 'return_pct': 0, 'win_rate': 0, 
                'max_drawdown': 0, 'num_trades': 0, 'sharpe_ratio': 0,
                'avg_win': 0, 'avg_loss': 0, 'profit_factor': 0,
                'avg_signal_strength': 0, 'best_strategy': 'None'
            }

        trades_df = pd.DataFrame(self.trades)
        
        # Basic metrics
        total_profit = trades_df['profit'].sum()
        return_pct = (total_profit / self.initial_capital) * 100
        win_rate = (trades_df['profit'] > 0).mean() * 100
        num_trades = len(self.trades)
        
        # Win/Loss analysis
        winning_trades = trades_df[trades_df['profit'] > 0]
        losing_trades = trades_df[trades_df['profit'] < 0]
        
        avg_win = winning_trades['profit'].mean() if len(winning_trades) > 0 else 0
        avg_loss = losing_trades['profit'].mean() if len(losing_trades) > 0 else 0
        profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else float('inf')
        
        # Drawdown calculation
        equity_series = self.portfolio['equity']
        returns = equity_series.pct_change().fillna(0)
        cum_returns = (1 + returns).cumprod()
        peak = cum_returns.cummax()
        drawdown = (cum_returns - peak) / peak
        max_drawdown = drawdown.min() * 100
        
        # Sharpe ratio
        if returns.std() != 0:
            periods_per_year = 365 if 'd' in self.timeframe else 365 * 24 if 'h' in self.timeframe else 365 * 24 * 60
            sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(periods_per_year)
        else:
            sharpe_ratio = 0
        
        # Strategy analysis
        avg_signal_strength = trades_df['signal_strength'].mean()
        strategy_performance = trades_df.groupby('strategy')['profit'].sum()
        best_strategy = strategy_performance.idxmax() if len(strategy_performance) > 0 else 'None'
        
        return {
            'total_profit': total_profit,
            'return_pct': return_pct,
            'win_rate': win_rate,
            'max_drawdown': max_drawdown,
            'num_trades': num_trades,
            'sharpe_ratio': sharpe_ratio,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': profit_factor,
            'avg_signal_strength': avg_signal_strength,
            'best_strategy': best_strategy,
            'strategy_breakdown': strategy_performance.to_dict()
        }

    def run_backtest(self, fetch_btc=True):
        """Run the enhanced backtest"""
        print(f"Starting enhanced backtest for {self.symbol}")
        
        self.fetch_data()
        
        if fetch_btc and self.symbol != 'BTCUSDT':
            try:
                btc_tester = Backtester('BTCUSDT', self.timeframe, self.start_date, self.end_date,
                                              api_key=self.client.api_key, api_secret=self.client.api_secret)
                btc_tester.fetch_data()
                btc_df = btc_tester.df
            except Exception as e:
                print(f"Failed to fetch BTC data: {e}")
                btc_df = None
        else:
            btc_df = None

        self.compute_indicators_and_strategies(btc_df)
        self.simulate_trades()
        
        metrics = self.get_performance_metrics()
        
        print(f"Enhanced backtest completed: {metrics['num_trades']} trades, "
              f"{metrics['return_pct']:.2f}% return, {metrics['win_rate']:.1f}% win rate")
        
        return metrics, self.trades, self.portfolio