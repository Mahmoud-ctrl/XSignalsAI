# indicators.py - Ultra Advanced Technical Analysis System
import pandas as pd
import numpy as np
import ta
from scipy import stats
from scipy.signal import argrelextrema
import warnings
from strategies import add_strategies_to_analysis
warnings.filterwarnings('ignore')

class AdvancedIndicators:
    def __init__(self, df):
        self.df = df.copy()
        self.prepare_data()
    
    def prepare_data(self):
        """Prepare and clean data"""
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in required_cols:
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
        
        # Calculate typical price and weighted close
        self.df['typical_price'] = (self.df['high'] + self.df['low'] + self.df['close']) / 3
        self.df['weighted_close'] = (self.df['high'] + self.df['low'] + 2*self.df['close']) / 4
    
    def momentum_indicators(self):
        """Advanced momentum indicators"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        volume = self.df['volume']
        
        # RSI family
        self.df['rsi_14'] = ta.momentum.RSIIndicator(close, window=14).rsi()
        self.df['rsi_21'] = ta.momentum.RSIIndicator(close, window=21).rsi()
        self.df['rsi_50'] = ta.momentum.RSIIndicator(close, window=50).rsi()
        
        # Stochastic family
        stoch = ta.momentum.StochasticOscillator(high, low, close)
        self.df['stoch_k'] = stoch.stoch()
        self.df['stoch_d'] = stoch.stoch_signal()
        
        # MACD family
        macd = ta.trend.MACD(close)
        self.df['macd'] = macd.macd()
        self.df['macd_signal'] = macd.macd_signal()
        self.df['macd_diff'] = macd.macd_diff()
        
        # Williams %R
        self.df['williams_r'] = ta.momentum.WilliamsRIndicator(high, low, close).williams_r()
        
        # Rate of Change
        self.df['roc_10'] = ta.momentum.ROCIndicator(close, window=10).roc()
        self.df['roc_20'] = ta.momentum.ROCIndicator(close, window=20).roc()
        
        # Commodity Channel Index
        self.df['cci'] = ta.trend.CCIIndicator(high, low, close).cci()
        
        # Money Flow Index
        self.df['mfi'] = ta.volume.MFIIndicator(high, low, close, volume).money_flow_index()
        
        # Ultimate Oscillator
        self.df['uo'] = ta.momentum.UltimateOscillator(high, low, close).ultimate_oscillator()
        
        # Awesome Oscillator
        self.df['ao'] = ta.momentum.AwesomeOscillatorIndicator(high, low).awesome_oscillator()
    
    def trend_indicators(self):
        """Advanced trend indicators"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        
        # EMA family
        for period in [5, 8, 13, 21, 34, 50, 89, 144, 200]:
            self.df[f'ema_{period}'] = ta.trend.EMAIndicator(close, window=period).ema_indicator()
        
        # SMA family
        for period in [10, 20, 50, 100, 200]:
            self.df[f'sma_{period}'] = ta.trend.SMAIndicator(close, window=period).sma_indicator()
        
        # ADX - Average Directional Index
        adx = ta.trend.ADXIndicator(high, low, close)
        self.df['adx'] = adx.adx()
        self.df['adx_pos'] = adx.adx_pos()
        self.df['adx_neg'] = adx.adx_neg()
        
        # Aroon
        # aroon = ta.trend.AroonIndicator(high=high, low=low, close=close)
        # self.df['aroon_up'] = aroon.aroon_up()
        # self.df['aroon_down'] = aroon.aroon_down()
        # self.df['aroon_ind'] = aroon.aroon_indicator()
        
        # PSAR - Parabolic SAR
        self.df['psar'] = ta.trend.PSARIndicator(high, low, close).psar()
        
        # Ichimoku Cloud
        ichimoku = ta.trend.IchimokuIndicator(high, low)
        self.df['ichimoku_a'] = ichimoku.ichimoku_a()
        self.df['ichimoku_b'] = ichimoku.ichimoku_b()
        self.df['ichimoku_base'] = ichimoku.ichimoku_base_line()
        self.df['ichimoku_conv'] = ichimoku.ichimoku_conversion_line()
        
        # Trix
        self.df['trix'] = ta.trend.TRIXIndicator(close).trix()
    
    def volatility_indicators(self):
        """Advanced volatility indicators"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        
        # Bollinger Bands family
        for period in [14, 20, 50]:
            bb = ta.volatility.BollingerBands(close, window=period)
            self.df[f'bb_upper_{period}'] = bb.bollinger_hband()
            self.df[f'bb_middle_{period}'] = bb.bollinger_mavg()
            self.df[f'bb_lower_{period}'] = bb.bollinger_lband()
            self.df[f'bb_width_{period}'] = bb.bollinger_wband()
            self.df[f'bb_pband_{period}'] = bb.bollinger_pband()
        
        # Average True Range
        self.df['atr_14'] = ta.volatility.AverageTrueRange(high, low, close).average_true_range()
        
        # Keltner Channel
        kc = ta.volatility.KeltnerChannel(high, low, close)
        self.df['kc_upper'] = kc.keltner_channel_hband()
        self.df['kc_middle'] = kc.keltner_channel_mband()
        self.df['kc_lower'] = kc.keltner_channel_lband()
        
        # Donchian Channel
        dc = ta.volatility.DonchianChannel(high, low, close)
        self.df['dc_upper'] = dc.donchian_channel_hband()
        self.df['dc_middle'] = dc.donchian_channel_mband()
        self.df['dc_lower'] = dc.donchian_channel_lband()
        
        # Ulcer Index
        self.df['ui'] = ta.volatility.UlcerIndex(close).ulcer_index()
    
    def volume_indicators(self):
        """Advanced volume indicators"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        volume = self.df['volume']
        
        # Volume SMAs
        for period in [10, 20, 50]:
            self.df[f'volume_sma_{period}'] = volume.rolling(period, min_periods=1).mean()
        
        # On Balance Volume
        self.df['obv'] = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()
        
        # Accumulation Distribution Line
        self.df['ad'] = ta.volume.AccDistIndexIndicator(high, low, close, volume).acc_dist_index()
        
        # Chaikin Money Flow
        self.df['cmf'] = ta.volume.ChaikinMoneyFlowIndicator(high, low, close, volume).chaikin_money_flow()
        
        # Volume Price Trend
        self.df['vpt'] = ta.volume.VolumePriceTrendIndicator(close, volume).volume_price_trend()
        
        # Ease of Movement
        self.df['eom'] = ta.volume.EaseOfMovementIndicator(high, low, volume).ease_of_movement()
        
        # Volume Weighted Average Price
        self.df['vwap'] = (close * volume).cumsum() / volume.cumsum()
        
        # Negative Volume Index
        self.df['nvi'] = ta.volume.NegativeVolumeIndexIndicator(close, volume).negative_volume_index()
    
    def custom_indicators(self):
        """Custom advanced indicators"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        volume = self.df['volume']
        
        # Price momentum
        self.df['momentum_10'] = close / close.shift(10) - 1
        self.df['momentum_20'] = close / close.shift(20) - 1
        
        # Volatility measures
        self.df['volatility_10'] = close.rolling(10, min_periods=1).std()
        self.df['volatility_20'] = close.rolling(20, min_periods=1).std()
        
        # Price position in range
        self.df['price_position'] = (close - low.rolling(14).min()) / (high.rolling(14).max() - low.rolling(14).min())
        
        # Volume momentum
        self.df['volume_momentum'] = volume / volume.rolling(20, min_periods=1).mean()
        
        # High-Low spread
        self.df['hl_spread'] = (high - low) / close
        
        # Price acceleration
        self.df['price_acceleration'] = close.diff().diff()
        
        # Trend strength
        self.df['trend_strength'] = abs(close.rolling(20, min_periods=1).apply(lambda x: stats.linregress(range(len(x)), x)[0] if len(x) > 1 else 0))
        
        # Support/Resistance levels
        self.calculate_support_resistance()
        
        # Market regime
        self.df['market_regime'] = self.classify_market_regime()
    
    def calculate_support_resistance(self):
        """Calculate dynamic support and resistance levels"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        
        # Find local minima and maxima
        local_min = argrelextrema(low.values, np.less, order=5)[0]
        local_max = argrelextrema(high.values, np.greater, order=5)[0]
        
        # Initialize support and resistance columns
        self.df['support'] = np.nan
        self.df['resistance'] = np.nan
        
        # Calculate support levels
        if len(local_min) > 0:
            recent_lows = low.iloc[local_min[-min(5, len(local_min)):]]
            support_level = recent_lows.mean()
            self.df['support'] = support_level
        
        # Calculate resistance levels
        if len(local_max) > 0:
            recent_highs = high.iloc[local_max[-min(5, len(local_max)):]]
            resistance_level = recent_highs.mean()
            self.df['resistance'] = resistance_level
    
    def classify_market_regime(self):
        """Classify market regime (trending/ranging)"""
        close = self.df['close']
        
        # Calculate 20-period linear regression slope
        def get_slope(series):
            if len(series) < 2:
                return 0
            x = np.arange(len(series))
            slope, _, r_value, _, _ = stats.linregress(x, series)
            return slope * r_value**2  # Adjust by R-squared
        
        slopes = close.rolling(20, min_periods=1).apply(get_slope)
        
        # Classify regime
        regime = np.where(slopes > 0.01, 1,  # Uptrend
                 np.where(slopes < -0.01, -1, 0))  # Downtrend, Sideways
        
        return regime
    
    def pattern_recognition(self):
        """Candlestick pattern recognition"""
        open_price = self.df['open']
        high = self.df['high']
        low = self.df['low']
        close = self.df['close']
        
        # Doji patterns
        body = abs(close - open_price)
        body_pct = body / close
        self.df['doji'] = body_pct < 0.001
        
        # Hammer and Hanging Man
        lower_shadow = np.where(close > open_price, open_price - low, close - low)
        upper_shadow = np.where(close > open_price, high - close, high - open_price)
        body_size = abs(close - open_price)
        
        self.df['hammer'] = (lower_shadow > 2 * body_size) & (upper_shadow < 0.1 * body_size)
        self.df['hanging_man'] = self.df['hammer']  # Same pattern, different context
        
        # Shooting Star and Inverted Hammer
        self.df['shooting_star'] = (upper_shadow > 2 * body_size) & (lower_shadow < 0.1 * body_size)
        self.df['inverted_hammer'] = self.df['shooting_star']
        
        # Engulfing patterns
        prev_body = abs(close.shift(1) - open_price.shift(1))
        curr_body = abs(close - open_price)
        
        bullish_engulfing = (close.shift(1) < open_price.shift(1)) & (close > open_price) & \
                           (open_price < close.shift(1)) & (close > open_price.shift(1)) & \
                           (curr_body > prev_body)
        
        bearish_engulfing = (close.shift(1) > open_price.shift(1)) & (close < open_price) & \
                           (open_price > close.shift(1)) & (close < open_price.shift(1)) & \
                           (curr_body > prev_body)
        
        self.df['bullish_engulfing'] = bullish_engulfing
        self.df['bearish_engulfing'] = bearish_engulfing
        
        # Morning Star and Evening Star (simplified 3-candle patterns)
        self.df['morning_star'] = self.detect_morning_star()
        self.df['evening_star'] = self.detect_evening_star()
    
    def detect_morning_star(self):
        """Detect Morning Star pattern"""
        close = self.df['close']
        open_price = self.df['open']
        
        # Simplified morning star detection
        cond1 = close.shift(2) < open_price.shift(2)  # First candle bearish
        cond2 = abs(close.shift(1) - open_price.shift(1)) < abs(close.shift(2) - open_price.shift(2)) * 0.3  # Small body
        cond3 = close > open_price  # Third candle bullish
        cond4 = close > (close.shift(2) + open_price.shift(2)) / 2  # Close above midpoint of first candle
        
        return cond1 & cond2 & cond3 & cond4
    
    def detect_evening_star(self):
        """Detect Evening Star pattern"""
        close = self.df['close']
        open_price = self.df['open']
        
        # Simplified evening star detection
        cond1 = close.shift(2) > open_price.shift(2)  # First candle bullish
        cond2 = abs(close.shift(1) - open_price.shift(1)) < abs(close.shift(2) - open_price.shift(2)) * 0.3  # Small body
        cond3 = close < open_price  # Third candle bearish
        cond4 = close < (close.shift(2) + open_price.shift(2)) / 2  # Close below midpoint of first candle
        
        return cond1 & cond2 & cond3 & cond4
    
    def fibonacci_levels(self):
        """Calculate Fibonacci retracement levels"""
        high = self.df['high']
        low = self.df['low']
        
        # Find recent swing high and low
        swing_high = high.rolling(20, min_periods=1).max().iloc[-1]
        swing_low = low.rolling(20, min_periods=1).min().iloc[-1]
        
        # Calculate Fibonacci levels
        diff = swing_high - swing_low
        
        fib_levels = {
            'fib_0': swing_high,
            'fib_236': swing_high - 0.236 * diff,
            'fib_382': swing_high - 0.382 * diff,
            'fib_500': swing_high - 0.500 * diff,
            'fib_618': swing_high - 0.618 * diff,
            'fib_786': swing_high - 0.786 * diff,
            'fib_100': swing_low
        }
        
        for level, value in fib_levels.items():
            self.df[level] = value
    
    def compute_all_indicators(self):
        print("Debug: Starting indicator computation...")
        """Compute all indicators and return analysis"""
        self.momentum_indicators()
        self.trend_indicators()
        self.volatility_indicators()
        self.volume_indicators()
        self.custom_indicators()
        self.pattern_recognition()
        self.fibonacci_levels()
        
        # Drop rows with NaN values
        self.df = self.df.dropna()
        
        if len(self.df) == 0:
            return None
        
        # Return the latest row with additional analysis
        latest = self.df.iloc[-1]
        
        # Add comprehensive analysis
        analysis = self.generate_comprehensive_analysis(latest)
        
        return latest, analysis, self.df
    
    def btc_correlation_indicators(self, btc_df=None):
        """Calculate BTC correlation indicators"""
        if btc_df is None:
            return
        
        close = self.df['close']
        btc_close = btc_df['close']
        
        # Align dataframes
        min_length = min(len(close), len(btc_close))
        close_aligned = close.tail(min_length)
        btc_close_aligned = btc_close.tail(min_length)
        
        # Calculate returns
        returns = close_aligned.pct_change().dropna()
        btc_returns = btc_close_aligned.pct_change().dropna()
        
        # Rolling correlations
        min_periods = min(10, min(len(returns), len(btc_returns)) // 4)
        
        try:
            # 20-period correlation
            correlation_20 = returns.rolling(20, min_periods=min_periods).corr(btc_returns)
            self.df['btc_correlation_20'] = correlation_20.reindex(self.df.index).fillna(method='ffill')
            
            # 50-period correlation
            correlation_50 = returns.rolling(50, min_periods=min_periods).corr(btc_returns)
            self.df['btc_correlation_50'] = correlation_50.reindex(self.df.index).fillna(method='ffill')
            
            # Current correlation strength
            latest_corr = correlation_20.iloc[-1] if not correlation_20.empty and not pd.isna(correlation_20.iloc[-1]) else 0
            self.df['btc_correlation_strength'] = abs(latest_corr)
            
            # Beta calculation (asset volatility relative to BTC)
            returns_std = returns.rolling(20, min_periods=min_periods).std()
            btc_returns_std = btc_returns.rolling(20, min_periods=min_periods).std()
            beta = (correlation_20 * returns_std / btc_returns_std)
            self.df['btc_beta'] = beta.reindex(self.df.index).fillna(method='ffill')
            
        except Exception as e:
            print(f"Error calculating BTC correlations: {e}")
            # Fill with default values
            self.df['btc_correlation_20'] = 0.0
            self.df['btc_correlation_50'] = 0.0
            self.df['btc_correlation_strength'] = 0.0
            self.df['btc_beta'] = 1.0

    def btc_market_regime_analysis(self, btc_latest=None):
        """Analyze BTC market regime impact"""
        if btc_latest is None:
            return {
                'regime': 'UNKNOWN',
                'strength': 0,
                'impact_assessment': 'Unable to assess BTC impact'
            }
        
        try:
            btc_rsi = btc_latest.get('rsi_14', 50)
            btc_trend_strength = btc_latest.get('trend_strength', 0)
            btc_adx = btc_latest.get('adx', 20)
            btc_market_regime = btc_latest.get('market_regime', 0)
            
            # Determine BTC regime
            if btc_market_regime == 1 and btc_adx > 25:
                regime = 'STRONG_UPTREND'
                strength = min(10, int((btc_adx - 25) / 5) + 7)
            elif btc_market_regime == -1 and btc_adx > 25:
                regime = 'STRONG_DOWNTREND' 
                strength = min(10, int((btc_adx - 25) / 5) + 7)
            elif btc_market_regime == 1:
                regime = 'WEAK_UPTREND'
                strength = 5
            elif btc_market_regime == -1:
                regime = 'WEAK_DOWNTREND'
                strength = 5
            else:
                regime = 'SIDEWAYS'
                strength = 2
                
            # Impact assessment
            if regime == 'STRONG_UPTREND':
                impact = 'Strongly supports altcoin bullish moves'
            elif regime == 'STRONG_DOWNTREND':
                impact = 'High risk for altcoin bearish pressure'
            elif regime == 'WEAK_UPTREND':
                impact = 'Mild support for altcoin upside'
            elif regime == 'WEAK_DOWNTREND':
                impact = 'Moderate risk for altcoin weakness'
            else:
                impact = 'Neutral impact on altcoin direction'
                
            return {
                'regime': regime,
                'strength': strength,
                'impact_assessment': impact,
                'btc_rsi': btc_rsi,
                'btc_adx': btc_adx
            }
            
        except Exception as e:
            print(f"Error analyzing BTC regime: {e}")
            return {
                'regime': 'UNKNOWN',
                'strength': 0,
                'impact_assessment': f'Error analyzing BTC: {str(e)}'
            }

    # Add to generate_comprehensive_analysis method:
    def analyze_btc_influence(self, latest, btc_analysis=None):
        """Analyze BTC influence on current asset"""
        if btc_analysis is None:
            return {
                'correlation_strength': 'UNKNOWN',
                'influence_level': 'UNKNOWN', 
                'risk_factors': ['BTC data unavailable'],
                'opportunities': [],
                'recommendations': ['Monitor BTC manually']
            }
        
        try:
            # Get correlation data
            correlation = latest.get('btc_correlation_20', 0)
            correlation_strength = abs(correlation)
            beta = latest.get('btc_beta', 1)
            
            # BTC regime data
            btc_regime = btc_analysis.get('regime', 'UNKNOWN')
            btc_strength = btc_analysis.get('strength', 0)
            
            influence_analysis = {
                'correlation_value': correlation,
                'correlation_strength': correlation_strength,
                'beta': beta,
                'btc_regime': btc_regime,
                'btc_strength': btc_strength,
                'risk_factors': [],
                'opportunities': [],
                'recommendations': []
            }
            
            # Determine influence level
            if correlation_strength > 0.8:
                influence_level = 'VERY_HIGH'
            elif correlation_strength > 0.6:
                influence_level = 'HIGH'
            elif correlation_strength > 0.4:
                influence_level = 'MODERATE'
            elif correlation_strength > 0.2:
                influence_level = 'LOW'
            else:
                influence_level = 'MINIMAL'
                
            influence_analysis['influence_level'] = influence_level
            
            # High correlation scenarios
            if correlation_strength > 0.7:
                if btc_regime in ['STRONG_DOWNTREND', 'WEAK_DOWNTREND'] and btc_strength > 6:
                    influence_analysis['risk_factors'].extend([
                        'High BTC correlation with bearish BTC trend',
                        'Altcoin likely to follow BTC weakness',
                        f'Beta of {beta:.2f} amplifies BTC moves'
                    ])
                    influence_analysis['recommendations'].extend([
                        'Reduce position sizes or wait for BTC stability',
                        'Set tighter stop losses',
                        'Consider BTC trend reversal first'
                    ])
                
                elif btc_regime in ['STRONG_UPTREND'] and btc_strength > 7:
                    influence_analysis['opportunities'].extend([
                        'Strong BTC uptrend supports altcoin momentum',
                        f'Beta of {beta:.2f} may amplify gains',
                        'BTC dominance supports crypto sector'
                    ])
                    influence_analysis['recommendations'].extend([
                        'BTC strength may boost altcoin performance',
                        'Can increase confidence in bullish setups'
                    ])
            
            # Moderate correlation scenarios  
            elif correlation_strength > 0.4:
                if btc_regime in ['STRONG_DOWNTREND']:
                    influence_analysis['risk_factors'].append('Moderate BTC correlation with strong BTC bearish trend')
                    influence_analysis['recommendations'].append('Monitor BTC levels closely')
                elif btc_regime in ['STRONG_UPTREND']:
                    influence_analysis['opportunities'].append('BTC strength may provide tailwind')
            
            # Low correlation scenarios
            else:
                influence_analysis['opportunities'].append('Low BTC correlation allows independent movement')
                influence_analysis['recommendations'].append('Focus on asset-specific technicals')
                
            return influence_analysis
            
        except Exception as e:
            print(f"Error analyzing BTC influence: {e}")
            return {
                'influence_level': 'ERROR',
                'risk_factors': [f'Analysis error: {str(e)}'],
                'opportunities': [],
                'recommendations': ['Manual BTC monitoring required']
            }
        
    def generate_comprehensive_analysis(self, latest, btc_latest=None, btc_analysis=None):
        """Generate comprehensive market analysis with BTC context"""
        analysis = {
            'trend_analysis': self.analyze_trend(latest),
            'momentum_analysis': self.analyze_momentum(latest), 
            'volatility_analysis': self.analyze_volatility(latest),
            'volume_analysis': self.analyze_volume(latest),
            'pattern_analysis': self.analyze_patterns(latest),
            'support_resistance': self.analyze_support_resistance(latest),
            'btc_regime_analysis': self.btc_market_regime_analysis(btc_latest),
            'btc_influence': self.analyze_btc_influence(latest, btc_analysis),
            'overall_signal': None
        }
        
        # Generate overall signal with BTC context
        analysis['overall_signal'] = self.generate_overall_signal_with_btc(analysis)
        
        return analysis
    
    def generate_overall_signal_with_btc(self, analysis):
        """Generate overall signal considering BTC influence"""
        # Get base signal
        base_signal = self.generate_overall_signal(analysis)
        
        # BTC influence adjustments
        btc_influence = analysis.get('btc_influence', {})
        influence_level = btc_influence.get('influence_level', 'LOW')
        btc_regime = btc_influence.get('btc_regime', 'UNKNOWN')
        
        adjusted_signal = base_signal.copy()
        
        # High correlation adjustments
        if influence_level in ['VERY_HIGH', 'HIGH'] and btc_regime in ['STRONG_DOWNTREND']:
            # Reduce bullish confidence when BTC is strongly bearish
            if base_signal['signal'] in ['STRONG BUY', 'BUY']:
                adjusted_signal['confidence'] = max(30, adjusted_signal['confidence'] - 20)
                adjusted_signal['btc_adjustment'] = 'Confidence reduced due to bearish BTC trend'
                
            # Increase bearish confidence when BTC confirms
            elif base_signal['signal'] in ['SELL', 'STRONG SELL']:
                adjusted_signal['confidence'] = min(95, adjusted_signal['confidence'] + 15)
                adjusted_signal['btc_adjustment'] = 'Confidence boosted by confirming BTC trend'
        
        elif influence_level in ['VERY_HIGH', 'HIGH'] and btc_regime in ['STRONG_UPTREND']:
            # Boost bullish confidence when BTC is strongly bullish
            if base_signal['signal'] in ['STRONG BUY', 'BUY']:
                adjusted_signal['confidence'] = min(95, adjusted_signal['confidence'] + 15)
                adjusted_signal['btc_adjustment'] = 'Confidence boosted by bullish BTC trend'
                
            # Reduce bearish confidence when BTC contradicts
            elif base_signal['signal'] in ['SELL', 'STRONG SELL']:
                adjusted_signal['confidence'] = max(30, adjusted_signal['confidence'] - 20)
                adjusted_signal['btc_adjustment'] = 'Confidence reduced due to conflicting BTC trend'
        
        else:
            adjusted_signal['btc_adjustment'] = 'No significant BTC adjustment needed'
        
        return adjusted_signal
    
    def analyze_trend(self, latest):
        """Analyze trend indicators"""
        trend_score = 0
        signals = []
        
        # EMA crossovers
        if latest['ema_8'] > latest['ema_21']:
            trend_score += 1
            signals.append("EMA 8 > EMA 21 (Bullish)")
        else:
            trend_score -= 1
            signals.append("EMA 8 < EMA 21 (Bearish)")
        
        if latest['ema_21'] > latest['ema_50']:
            trend_score += 1
            signals.append("EMA 21 > EMA 50 (Bullish)")
        else:
            trend_score -= 1
            signals.append("EMA 21 < EMA 50 (Bearish)")
        
        # ADX strength
        if latest['adx'] > 25:
            signals.append(f"Strong trend (ADX: {latest['adx']:.1f})")
            if latest['adx_pos'] > latest['adx_neg']:
                trend_score += 1
                signals.append("Bullish ADX direction")
            else:
                trend_score -= 1
                signals.append("Bearish ADX direction")
        else:
            signals.append(f"Weak trend (ADX: {latest['adx']:.1f})")
        
        # Market regime
        if latest['market_regime'] == 1:
            trend_score += 2
            signals.append("Uptrending market regime")
        elif latest['market_regime'] == -1:
            trend_score -= 2
            signals.append("Downtrending market regime")
        else:
            signals.append("Sideways market regime")
        
        return {
            'score': trend_score,
            'signals': signals,
            'strength': 'Strong' if abs(trend_score) >= 3 else 'Moderate' if abs(trend_score) >= 1 else 'Weak'
        }
    
    def analyze_momentum(self, latest):
        """Analyze momentum indicators"""
        momentum_score = 0
        signals = []
        
        # RSI analysis
        rsi = latest['rsi_14']
        if rsi > 70:
            momentum_score -= 1
            signals.append(f"RSI overbought ({rsi:.1f})")
        elif rsi < 30:
            momentum_score += 1
            signals.append(f"RSI oversold ({rsi:.1f})")
        else:
            signals.append(f"RSI neutral ({rsi:.1f})")
        
        # MACD analysis
        if latest['macd'] > latest['macd_signal']:
            momentum_score += 1
            signals.append("MACD bullish crossover")
        else:
            momentum_score -= 1
            signals.append("MACD bearish crossover")
        
        # Stochastic analysis
        if latest['stoch_k'] > 80:
            momentum_score -= 1
            signals.append("Stochastic overbought")
        elif latest['stoch_k'] < 20:
            momentum_score += 1
            signals.append("Stochastic oversold")
        
        # Williams %R
        if latest['williams_r'] > -20:
            momentum_score -= 1
            signals.append("Williams %R overbought")
        elif latest['williams_r'] < -80:
            momentum_score += 1
            signals.append("Williams %R oversold")
        
        return {
            'score': momentum_score,
            'signals': signals,
            'strength': 'Strong' if abs(momentum_score) >= 3 else 'Moderate' if abs(momentum_score) >= 1 else 'Weak'
        }
    
    def analyze_volatility(self, latest):
        """Analyze volatility indicators"""
        signals = []
        
        # Bollinger Bands
        bb_position = latest['bb_pband_20']
        if bb_position > 0.8:
            signals.append("Price near upper Bollinger Band")
        elif bb_position < 0.2:
            signals.append("Price near lower Bollinger Band")
        else:
            signals.append("Price within Bollinger Bands")
        
        # ATR analysis
        atr = latest['atr_14']
        volatility_level = "High" if atr > latest['close'] * 0.03 else "Normal"
        signals.append(f"Volatility: {volatility_level} (ATR: {atr:.2f})")
        
        return {
            'signals': signals,
            'bb_position': bb_position,
            'atr': atr
        }
    
    def analyze_volume(self, latest):
        """Analyze volume indicators"""
        volume_score = 0
        signals = []
        
        # Volume momentum
        vol_momentum = latest['volume_momentum']
        if vol_momentum > 1.5:
            volume_score += 1
            signals.append(f"High volume activity ({vol_momentum:.1f}x average)")
        elif vol_momentum < 0.5:
            volume_score -= 1
            signals.append(f"Low volume activity ({vol_momentum:.1f}x average)")
        
        # OBV trend
        # Note: This would require comparing with previous values
        signals.append("OBV analysis requires historical comparison")
        
        return {
            'score': volume_score,
            'signals': signals
        }
    
    def analyze_patterns(self, latest):
        """Analyze candlestick patterns"""
        patterns = []
        
        if latest['doji']:
            patterns.append("Doji - Indecision")
        if latest['hammer']:
            patterns.append("Hammer - Potential reversal")
        if latest['shooting_star']:
            patterns.append("Shooting Star - Potential reversal")
        if latest['bullish_engulfing']:
            patterns.append("Bullish Engulfing - Strong bullish signal")
        if latest['bearish_engulfing']:
            patterns.append("Bearish Engulfing - Strong bearish signal")
        if latest['morning_star']:
            patterns.append("Morning Star - Bullish reversal")
        if latest['evening_star']:
            patterns.append("Evening Star - Bearish reversal")
        
        return {
            'patterns': patterns if patterns else ['No significant patterns detected']
        }
    
    def analyze_support_resistance(self, latest):
        """Analyze support and resistance levels"""
        current_price = latest['close']
        support = latest['support']
        resistance = latest['resistance']
        
        analysis = {
            'current_price': current_price,
            'support': support,
            'resistance': resistance,
            'distance_to_support': ((current_price - support) / current_price * 100) if not pd.isna(support) else None,
            'distance_to_resistance': ((resistance - current_price) / current_price * 100) if not pd.isna(resistance) else None
        }
        
        return analysis
    
    def generate_overall_signal(self, analysis):
        """Generate overall trading signal"""
        total_score = 0
        confidence = 0
        
        # Weight different analyses
        total_score += analysis['trend_analysis']['score'] * 0.4
        total_score += analysis['momentum_analysis']['score'] * 0.3
        total_score += analysis['volume_analysis']['score'] * 0.2
        
        # Adjust for patterns
        patterns = analysis['pattern_analysis']['patterns']
        if any('bullish' in p.lower() for p in patterns):
            total_score += 1
        if any('bearish' in p.lower() for p in patterns):
            total_score -= 1
        
        # Calculate confidence based on agreement between indicators
        trend_strength = analysis['trend_analysis']['strength']
        momentum_strength = analysis['momentum_analysis']['strength']
        
        if trend_strength == 'Strong' and momentum_strength == 'Strong':
            confidence = min(90, abs(total_score) * 15 + 60)
        elif trend_strength in ['Strong', 'Moderate'] or momentum_strength in ['Strong', 'Moderate']:
            confidence = min(75, abs(total_score) * 12 + 45)
        else:
            confidence = min(60, abs(total_score) * 10 + 30)
        
        # Generate signal
        if total_score > 1.5:
            signal = "STRONG BUY"
        elif total_score > 0.5:
            signal = "BUY"
        elif total_score > -0.5:
            signal = "WAIT"
        elif total_score > -1.5:
            signal = "SELL"
        else:
            signal = "STRONG SELL"
        
        return {
            'signal': signal,
            'score': total_score,
            'confidence': confidence
        }

def compute_indicators(df, btc_df=None):
    """Main function to compute all indicators with optional BTC context"""
    try:
        indicator_system = AdvancedIndicators(df)
        
        # Add BTC correlation if BTC data provided
        if btc_df is not None:
            indicator_system.btc_correlation_indicators(btc_df)
            # Compute BTC indicators for regime analysis
            btc_indicator_system = AdvancedIndicators(btc_df)
            btc_result = btc_indicator_system.compute_all_indicators()
            btc_latest = btc_result[0] if btc_result and btc_result[0] is not None else None
            btc_analysis = btc_result[1] if btc_result and len(btc_result) > 1 else None
        else:
            btc_latest = None
            btc_analysis = None
        
        result = indicator_system.compute_all_indicators()
        
        if result is None:
            return None, None, None
        
        latest, analysis, full_df = result
        
        # Enhance analysis with BTC context
        if btc_latest is not None:
            btc_regime = indicator_system.btc_market_regime_analysis(btc_latest)
            analysis['btc_regime_analysis'] = btc_regime
            analysis['btc_influence'] = indicator_system.analyze_btc_influence(latest, btc_regime)
            
            # Update overall signal with BTC context
            analysis['overall_signal'] = indicator_system.generate_overall_signal_with_btc(analysis)
        
        # Add strategies
        if full_df is not None:
            from strategies import add_strategies_to_analysis
            strategy_results = add_strategies_to_analysis(df, full_df)
            analysis['strategies'] = strategy_results
            
        return latest, analysis, full_df
    
    except Exception as e:
        import traceback
        print(f"Error computing indicators: {e}")
        print(traceback.format_exc())
        return None, None, None