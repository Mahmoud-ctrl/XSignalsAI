from indicators import compute_indicators
import pandas as pd
import numpy as np
import time

class BTCAnalyzer:
    """Handles all BTC correlation and analysis operations"""
    
    def __init__(self, data_manager):
        self.data_manager = data_manager

    def get_btc_context(self, timeframes=['1h', '4h']):
        """Get BTC context for correlation analysis"""
        btc_data = {}
        
        for tf in timeframes:
            try:
                print(f"Fetching BTC data for {tf} timeframe...")
                df = self.data_manager.fetch_historical_data('BTCUSDT', tf, limit=200)
                
                if df is not None:
                    latest, analysis, _ = compute_indicators(df)
                    
                    if latest is not None and analysis is not None:
                        btc_data[tf] = {
                            'price': float(latest['close']),
                            'trend': analysis['overall_signal']['signal'],
                            'strength': analysis['overall_signal']['confidence'],
                            'rsi': float(latest['rsi_14']),
                            'support': float(latest['support']) if not pd.isna(latest['support']) else None,
                            'resistance': float(latest['resistance']) if not pd.isna(latest['resistance']) else None,
                            'adx': float(latest['adx']),
                            'market_regime': int(latest['market_regime']),
                            'trend_strength': float(latest['trend_strength']),
                            'volume_momentum': float(latest['volume_momentum']),
                            'atr_14': float(latest['atr_14']),
                            'price_change_24h': self.data_manager.calculate_24h_change('BTCUSDT')
                        }
                        print(f"✅ BTC {tf} data: {btc_data[tf]['trend']} ({btc_data[tf]['strength']:.1f}%)")
                
                time.sleep(0.1)
                
            except Exception as e:
                print(f"Error fetching BTC data for {tf}: {e}")
                continue
        
        return btc_data

    def calculate_btc_correlation(self, symbol, lookback_periods=100):
        """Calculate correlation with BTC over specified periods"""
        try:
            asset_df = self.data_manager.fetch_historical_data(symbol, '4h', limit=lookback_periods + 50)  # Changed from +10 to +50
            btc_df = self.data_manager.fetch_historical_data('BTCUSDT', '4h', limit=lookback_periods + 50)
            
            if asset_df is None or btc_df is None:
                return None
                
            asset_returns = asset_df['close'].pct_change().dropna()
            btc_returns = btc_df['close'].pct_change().dropna()
            
            min_length = min(len(asset_returns), len(btc_returns))
            if min_length < 75:
                return None
            
            print(f"Asset returns length: {len(asset_returns)}, BTC returns length: {len(btc_returns)}")
            print(f"Min length after alignment: {min_length}")
                
            asset_returns = asset_returns.tail(min_length)
            btc_returns = btc_returns.tail(min_length)
            
            correlation = np.corrcoef(asset_returns.values, btc_returns.values)[0, 1]
            
            asset_std = asset_returns.std()
            btc_std = btc_returns.std()
            beta = (correlation * asset_std / btc_std) if btc_std > 0 else 1.0
            
            correlation_strength = abs(correlation)
            if correlation_strength > 0.8:
                reliability = 'very_high'
            elif correlation_strength > 0.6:
                reliability = 'high'  
            elif correlation_strength > 0.4:
                reliability = 'moderate'
            elif correlation_strength > 0.2:
                reliability = 'low'
            else:
                reliability = 'minimal'
                
            return {
                'correlation': correlation,
                'strength': correlation_strength,
                'beta': beta,
                'direction': 'positive' if correlation > 0 else 'negative',
                'reliability': reliability,
                'sample_size': min_length
            }
            
        except Exception as e:
            print(f"Error calculating BTC correlation: {e}")
            return None

    def analyze_btc_influence(self, symbol_analysis, btc_context, correlation_data):
        """Determine how BTC might affect the trade setup"""
        
        if not btc_context:
            return {
                'influence': 'unknown',
                'recommendation': 'BTC data unavailable - monitor manually',
                'risk_level': 'medium',
                'confidence_adjustment': 0
            }
        
        primary_tf = '4h' if '4h' in btc_context else list(btc_context.keys())[0]
        btc_data = btc_context[primary_tf]
        
        btc_trend = btc_data['trend']
        btc_strength = btc_data['strength']
        btc_price_change = btc_data.get('price_change_24h', 0)
        
        influence_analysis = {
            'btc_trend': btc_trend,
            'btc_strength': btc_strength,
            'btc_24h_change': btc_price_change,
            'correlation_strength': correlation_data['strength'] if correlation_data else 0,
            'beta': correlation_data['beta'] if correlation_data else 1.0,
            'risk_factors': [],
            'opportunities': [], 
            'recommendations': [],
            'confidence_adjustment': 0,
            'position_size_adjustment': 'normal'
        }
        
        correlation_strength = correlation_data['strength'] if correlation_data else 0
        
        # High correlation scenarios (>70% correlation)
        if correlation_strength > 0.7:
            if btc_trend in ['SELL', 'STRONG SELL'] and btc_strength > 65:
                influence_analysis['risk_factors'].extend([
                    f'High correlation ({correlation_strength:.1f}) with bearish BTC ({btc_strength:.0f}% confidence)',
                    f'BTC 24h: {btc_price_change:+.1f}% - negative momentum',
                    'Altcoin likely to follow BTC weakness'
                ])
                influence_analysis['recommendations'].extend([
                    'Reduce position size by 30-50%',
                    'Use tighter stop losses',  
                    'Wait for BTC stabilization for better entries'
                ])
                influence_analysis['confidence_adjustment'] = -15
                influence_analysis['position_size_adjustment'] = 'reduce'
            
            elif btc_trend in ['BUY', 'STRONG BUY'] and btc_strength > 65:
                influence_analysis['opportunities'].extend([
                    f'High correlation ({correlation_strength:.1f}) with bullish BTC ({btc_strength:.0f}% confidence)',
                    f'BTC 24h: {btc_price_change:+.1f}% - positive momentum',
                    'Strong BTC trend supports altcoin momentum'
                ])
                influence_analysis['recommendations'].extend([
                    'BTC strength may amplify altcoin moves',
                    'Can increase position size confidence',
                    'Look for entries on BTC pullbacks'
                ])
                influence_analysis['confidence_adjustment'] = +10
                influence_analysis['position_size_adjustment'] = 'normal_to_large'
                
            else:
                influence_analysis['recommendations'].append(f'High BTC correlation - monitor BTC levels at ${btc_data["price"]:.0f}')
        
        # Moderate correlation scenarios (40-70% correlation)  
        elif correlation_strength > 0.4:
            if btc_trend in ['STRONG SELL'] and btc_strength > 75:
                influence_analysis['risk_factors'].append(f'Moderate correlation with very bearish BTC trend')
                influence_analysis['recommendations'].append('Reduce risk - BTC selling pressure may impact altcoins')
                influence_analysis['confidence_adjustment'] = -8
                
            elif btc_trend in ['STRONG BUY'] and btc_strength > 75:
                influence_analysis['opportunities'].append('BTC bullish momentum may provide sector tailwind')
                influence_analysis['confidence_adjustment'] = +5
            
            influence_analysis['recommendations'].append(f'Moderate BTC influence - watch key BTC levels')
        
        # Low correlation scenarios (<40% correlation)
        else:
            influence_analysis['opportunities'].append(f'Low BTC correlation ({correlation_strength:.1f}) allows independent price action')
            influence_analysis['recommendations'].extend([
                'Focus on asset-specific technicals',
                'Less concern about BTC short-term moves'
            ])
        
        # Critical BTC levels analysis
        btc_support = btc_data.get('support')
        btc_resistance = btc_data.get('resistance') 
        btc_price = btc_data['price']
        
        if btc_support and btc_resistance:
            support_distance = (btc_price - btc_support) / btc_price * 100
            resistance_distance = (btc_resistance - btc_price) / btc_price * 100
            
            if support_distance < 2:
                influence_analysis['risk_factors'].append(f'BTC near key support ${btc_support:.0f} ({support_distance:.1f}% below)')
                influence_analysis['recommendations'].append('Watch for BTC support hold/break')
                
            if resistance_distance < 2:
                influence_analysis['opportunities'].append(f'BTC near key resistance ${btc_resistance:.0f} ({resistance_distance:.1f}% above)')
                influence_analysis['recommendations'].append('BTC breakout could boost altcoins')
        
        # Overall influence rating
        if correlation_strength > 0.7 and btc_strength > 70:
            influence_analysis['influence'] = 'very_high'
            influence_analysis['risk_level'] = 'high' if btc_trend in ['SELL', 'STRONG SELL'] else 'medium'
        elif correlation_strength > 0.4 or btc_strength > 80:
            influence_analysis['influence'] = 'moderate'
            influence_analysis['risk_level'] = 'medium'
        else:
            influence_analysis['influence'] = 'low'
            influence_analysis['risk_level'] = 'low'
        
        return influence_analysis
