# strategies.py - Advanced Multi-Indicator Trading Strategies
import pandas as pd
import numpy as np

class TradingStrategies:
    def __init__(self, df, indicators_df):
        self.df = df.copy()
        self.indicators = indicators_df.copy()
        self.signals = pd.DataFrame(index=self.indicators.index)

    def scalping_ema_strategy(self):
        """High-frequency EMA crossover strategy for more trades"""
        # Fast EMA crossovers for more signals
        ema_5_8_bull = (self.indicators['ema_5'] > self.indicators['ema_8']) & \
                       (self.indicators['ema_5'].shift(1) <= self.indicators['ema_8'].shift(1))
        ema_5_8_bear = (self.indicators['ema_5'] < self.indicators['ema_8']) & \
                       (self.indicators['ema_5'].shift(1) >= self.indicators['ema_8'].shift(1))
        
        # Trend filter using longer EMA
        uptrend = self.indicators['ema_21'] > self.indicators['ema_50']
        downtrend = self.indicators['ema_21'] < self.indicators['ema_50']
        
        # Volume filter for quality
        volume_ok = self.indicators['volume_momentum'] > 0.8
        
        # RSI not extreme
        rsi_ok = (self.indicators['rsi_14'] > 25) & (self.indicators['rsi_14'] < 75)
        
        buy_signal = ema_5_8_bull & uptrend & volume_ok & rsi_ok
        sell_signal = ema_5_8_bear & downtrend & volume_ok & rsi_ok
        
        self.signals['scalping_ema_buy'] = buy_signal
        self.signals['scalping_ema_sell'] = sell_signal
        
        return {
            'name': 'Scalping EMA Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Fast EMA crossovers with trend and volume filters'
        }
    
    def rsi_mean_reversion_strategy(self):
        """RSI mean reversion with multiple entry levels"""
        rsi = self.indicators['rsi_14']
        
        # Multiple RSI levels for more opportunities
        rsi_oversold_30 = rsi < 30
        rsi_oversold_35 = (rsi >= 30) & (rsi < 35) & (rsi.shift(1) < 30)
        rsi_overbought_70 = rsi > 70
        rsi_overbought_65 = (rsi <= 70) & (rsi > 65) & (rsi.shift(1) > 70)
        
        # RSI momentum
        rsi_rising = rsi > rsi.shift(1)
        rsi_falling = rsi < rsi.shift(1)
        
        # Support/resistance confirmation
        near_support = abs(self.indicators['close'] - self.indicators['support']) / self.indicators['close'] < 0.02
        near_resistance = abs(self.indicators['close'] - self.indicators['resistance']) / self.indicators['close'] < 0.02
        
        # Bollinger bands position
        bb_lower_touch = self.indicators['close'] <= self.indicators['bb_lower_20'] * 1.005
        bb_upper_touch = self.indicators['close'] >= self.indicators['bb_upper_20'] * 0.995
        
        buy_signal = ((rsi_oversold_30 | rsi_oversold_35) & rsi_rising) | (near_support & bb_lower_touch & rsi_rising)
        sell_signal = ((rsi_overbought_70 | rsi_overbought_65) & rsi_falling) | (near_resistance & bb_upper_touch & rsi_falling)
        
        self.signals['rsi_mean_rev_buy'] = buy_signal
        self.signals['rsi_mean_rev_sell'] = sell_signal
        
        return {
            'name': 'RSI Mean Reversion Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Multiple RSI levels with support/resistance confirmation'
        }
    
    def momentum_breakout_strategy(self):
        """Momentum breakout strategy with volume confirmation"""
        close = self.indicators['close']
        
        # Price breakouts
        resistance_break = close > self.indicators['resistance'] * 1.002
        support_break = close < self.indicators['support'] * 0.998
        
        # Bollinger band breakouts
        bb_upper_break = close > self.indicators['bb_upper_20']
        bb_lower_break = close < self.indicators['bb_lower_20']
        
        # 20-period high/low breaks
        high_20_break = close > self.indicators['high'].rolling(20).max().shift(1)
        low_20_break = close < self.indicators['low'].rolling(20).min().shift(1)
        
        # Volume confirmation
        strong_volume = self.indicators['volume_momentum'] > 1.5
        good_volume = self.indicators['volume_momentum'] > 1.2
        
        # Momentum confirmation
        strong_momentum = abs(self.indicators['momentum_10']) > 0.02
        rsi_momentum = ((self.indicators['rsi_14'] > 50) & (self.indicators['rsi_14'] < 80)) | \
                      ((self.indicators['rsi_14'] < 50) & (self.indicators['rsi_14'] > 20))
        
        buy_signal = ((resistance_break & strong_volume) | 
                     (bb_upper_break & good_volume) | 
                     (high_20_break & good_volume)) & strong_momentum & rsi_momentum
        
        sell_signal = ((support_break & strong_volume) | 
                      (bb_lower_break & good_volume) | 
                      (low_20_break & good_volume)) & strong_momentum & rsi_momentum
        
        self.signals['momentum_break_buy'] = buy_signal
        self.signals['momentum_break_sell'] = sell_signal
        
        return {
            'name': 'Momentum Breakout Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Multiple breakout patterns with volume and momentum confirmation'
        }
    
    def stochastic_divergence_strategy(self):
        """Enhanced Stochastic strategy with divergence detection"""
        stoch_k = self.indicators['stoch_k']
        stoch_d = self.indicators['stoch_d']
        close = self.indicators['close']
        
        # Stochastic crossovers
        stoch_bull_cross = (stoch_k > stoch_d) & (stoch_k.shift(1) <= stoch_d.shift(1))
        stoch_bear_cross = (stoch_k < stoch_d) & (stoch_k.shift(1) >= stoch_d.shift(1))
        
        # Stochastic levels
        stoch_oversold = (stoch_k < 25) & (stoch_d < 25)
        stoch_overbought = (stoch_k > 75) & (stoch_d > 75)
        stoch_mid_bull = (stoch_k > 40) & (stoch_k < 60) & stoch_bull_cross
        stoch_mid_bear = (stoch_k > 40) & (stoch_k < 60) & stoch_bear_cross
        
        # Simple divergence approximation
        price_higher = close > close.shift(5)
        price_lower = close < close.shift(5)
        stoch_lower = stoch_k < stoch_k.shift(5)
        stoch_higher = stoch_k > stoch_k.shift(5)
        
        bullish_divergence = price_lower & stoch_higher & stoch_oversold
        bearish_divergence = price_higher & stoch_lower & stoch_overbought
        
        # RSI confirmation
        rsi_confirm_bull = self.indicators['rsi_14'] < 60
        rsi_confirm_bear = self.indicators['rsi_14'] > 40
        
        buy_signal = ((stoch_bull_cross & stoch_oversold) | 
                     stoch_mid_bull | 
                     bullish_divergence) & rsi_confirm_bull
        
        sell_signal = ((stoch_bear_cross & stoch_overbought) | 
                      stoch_mid_bear | 
                      bearish_divergence) & rsi_confirm_bear
        
        self.signals['stoch_div_buy'] = buy_signal
        self.signals['stoch_div_sell'] = sell_signal
        
        return {
            'name': 'Stochastic Divergence Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Stochastic crossovers with divergence detection and RSI confirmation'
        }
    
    def multi_timeframe_rsi_strategy(self):
        """Multi-timeframe RSI strategy using different RSI periods"""
        rsi_14 = self.indicators['rsi_14']
        rsi_21 = self.indicators['rsi_21'] 
        rsi_50 = self.indicators['rsi_50']
        
        # RSI alignment for strong signals
        all_rsi_bullish = (rsi_14 > 45) & (rsi_21 > 45) & (rsi_50 > 45)
        all_rsi_bearish = (rsi_14 < 55) & (rsi_21 < 55) & (rsi_50 < 55)
        
        # RSI oversold/overbought across timeframes
        multi_oversold = (rsi_14 < 35) | ((rsi_14 < 40) & (rsi_21 < 40))
        multi_overbought = (rsi_14 > 65) | ((rsi_14 > 60) & (rsi_21 > 60))
        
        # RSI momentum
        rsi_14_rising = rsi_14 > rsi_14.shift(1)
        rsi_14_falling = rsi_14 < rsi_14.shift(1)
        
        # Price action confirmation
        price_above_ema8 = self.indicators['close'] > self.indicators['ema_8']
        price_below_ema8 = self.indicators['close'] < self.indicators['ema_8']
        
        # Volume filter
        volume_ok = self.indicators['volume_momentum'] > 0.9
        
        buy_signal = ((multi_oversold & rsi_14_rising & price_above_ema8) | 
                     (all_rsi_bullish & price_above_ema8 & (rsi_14 > rsi_14.shift(2)))) & volume_ok
        
        sell_signal = ((multi_overbought & rsi_14_falling & price_below_ema8) | 
                      (all_rsi_bearish & price_below_ema8 & (rsi_14 < rsi_14.shift(2)))) & volume_ok
        
        self.signals['multi_rsi_buy'] = buy_signal
        self.signals['multi_rsi_sell'] = sell_signal
        
        return {
            'name': 'Multi-Timeframe RSI Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'RSI across multiple timeframes with momentum and price action confirmation'
        }
    
    def williams_r_pullback_strategy(self):
        """Williams %R pullback strategy for trend continuation"""
        wr = self.indicators['williams_r']
        close = self.indicators['close']
        
        # Trend identification
        uptrend = (self.indicators['ema_21'] > self.indicators['ema_50']) & \
                 (self.indicators['close'] > self.indicators['ema_21'])
        downtrend = (self.indicators['ema_21'] < self.indicators['ema_50']) & \
                   (self.indicators['close'] < self.indicators['ema_21'])
        
        # Williams %R pullback signals
        wr_pullback_buy = (wr < -50) & (wr > -85) & (wr > wr.shift(1)) & uptrend
        wr_pullback_sell = (wr > -50) & (wr < -15) & (wr < wr.shift(1)) & downtrend
        
        # Additional Williams %R patterns
        wr_oversold_exit = (wr > -80) & (wr.shift(1) <= -80) & uptrend
        wr_overbought_exit = (wr < -20) & (wr.shift(1) >= -20) & downtrend
        
        # CCI confirmation
        cci_neutral = (self.indicators['cci'] > -150) & (self.indicators['cci'] < 150)
        
        # MACD trend confirmation
        macd_bullish = self.indicators['macd'] > self.indicators['macd_signal']
        macd_bearish = self.indicators['macd'] < self.indicators['macd_signal']
        
        buy_signal = (wr_pullback_buy | wr_oversold_exit) & cci_neutral & macd_bullish
        sell_signal = (wr_pullback_sell | wr_overbought_exit) & cci_neutral & macd_bearish
        
        self.signals['wr_pullback_buy'] = buy_signal
        self.signals['wr_pullback_sell'] = sell_signal
        
        return {
            'name': 'Williams %R Pullback Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Williams %R pullbacks in trending markets with CCI and MACD confirmation'
        }

    def adaptive_bb_strategy(self):
        """Adaptive Bollinger Bands strategy with squeeze detection"""
        close = self.indicators['close']
        bb_upper = self.indicators['bb_upper_20']
        bb_lower = self.indicators['bb_lower_20']
        bb_middle = self.indicators['bb_middle_20']
        bb_width = self.indicators['bb_width_20']
        
        # BB position
        bb_position = (close - bb_lower) / (bb_upper - bb_lower)
        
        # Squeeze detection
        bb_squeeze = bb_width < bb_width.rolling(20).mean() * 0.8
        bb_expansion = bb_width > bb_width.shift(1) * 1.1
        
        # Mean reversion signals
        bb_oversold = bb_position < 0.1
        bb_overbought = bb_position > 0.9
        
        # Trend following signals
        bb_uptrend = (close > bb_middle) & (bb_middle > bb_middle.shift(5))
        bb_downtrend = (close < bb_middle) & (bb_middle < bb_middle.shift(5))
        
        # Volume confirmation
        volume_confirm = self.indicators['volume_momentum'] > 1.1
        
        # RSI filter
        rsi_not_extreme = (self.indicators['rsi_14'] > 25) & (self.indicators['rsi_14'] < 75)
        
        # Combined signals
        buy_signal = ((bb_oversold & (close > close.shift(1))) |  # Mean reversion
                     (bb_squeeze & bb_expansion & bb_uptrend & volume_confirm)) & rsi_not_extreme  # Breakout
        
        sell_signal = ((bb_overbought & (close < close.shift(1))) |  # Mean reversion
                      (bb_squeeze & bb_expansion & bb_downtrend & volume_confirm)) & rsi_not_extreme  # Breakdown
        
        self.signals['adaptive_bb_buy'] = buy_signal
        self.signals['adaptive_bb_sell'] = sell_signal
        
        return {
            'name': 'Adaptive Bollinger Bands Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'BB mean reversion and squeeze breakouts with volume confirmation'
        }
    
    def macd_histogram_strategy(self):
        """MACD histogram momentum strategy"""
        macd = self.indicators['macd']
        macd_signal = self.indicators['macd_signal']
        macd_histogram = self.indicators['macd_diff']
        
        # MACD histogram momentum
        histogram_rising = macd_histogram > macd_histogram.shift(1)
        histogram_falling = macd_histogram < macd_histogram.shift(1)
        
        # MACD line momentum
        macd_rising = macd > macd.shift(1)
        macd_falling = macd < macd.shift(1)
        
        # MACD crossovers
        macd_bull_cross = (macd > macd_signal) & (macd.shift(1) <= macd_signal.shift(1))
        macd_bear_cross = (macd < macd_signal) & (macd.shift(1) >= macd_signal.shift(1))
        
        # Zero line crosses
        macd_above_zero = macd > 0
        macd_below_zero = macd < 0
        
        # Histogram divergence (simplified)
        histogram_bullish_div = (macd_histogram > 0) & histogram_rising & macd_below_zero
        histogram_bearish_div = (macd_histogram < 0) & histogram_falling & macd_above_zero
        
        # Price momentum confirmation
        price_momentum_bull = self.indicators['momentum_10'] > 0
        price_momentum_bear = self.indicators['momentum_10'] < 0
        
        buy_signal = ((macd_bull_cross & macd_above_zero) |
                     (histogram_rising & macd_rising & macd_above_zero) |
                     histogram_bullish_div) & price_momentum_bull
        
        sell_signal = ((macd_bear_cross & macd_below_zero) |
                      (histogram_falling & macd_falling & macd_below_zero) |
                      histogram_bearish_div) & price_momentum_bear
        
        self.signals['macd_hist_buy'] = buy_signal
        self.signals['macd_hist_sell'] = sell_signal
        
        return {
            'name': 'MACD Histogram Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'MACD histogram momentum with divergence detection'
        }
    
    def volume_price_analysis_strategy(self):
        """Volume Price Analysis with multiple confirmations"""
        close = self.indicators['close']
        volume_momentum = self.indicators['volume_momentum']
        
        # Volume patterns
        volume_spike = volume_momentum > 2.0
        volume_high = volume_momentum > 1.5
        volume_above_avg = volume_momentum > 1.1
        
        # Price action
        strong_green_candle = (close - self.indicators['open']) / close > 0.01
        strong_red_candle = (self.indicators['open'] - close) / close > 0.01
        
        # OBV momentum
        obv_rising = self.indicators['obv'] > self.indicators['obv'].shift(3)
        obv_falling = self.indicators['obv'] < self.indicators['obv'].shift(3)
        
        # CMF (Chaikin Money Flow)
        cmf_bullish = self.indicators['cmf'] > 0.1
        cmf_bearish = self.indicators['cmf'] < -0.1
        
        # Price vs Volume analysis
        price_up_volume_up = (close > close.shift(1)) & (volume_momentum > 1.2)
        price_down_volume_up = (close < close.shift(1)) & (volume_momentum > 1.2)
        
        # Support/Resistance with volume
        near_support_volume = (abs(close - self.indicators['support']) / close < 0.015) & volume_high
        near_resistance_volume = (abs(close - self.indicators['resistance']) / close < 0.015) & volume_high
        
        buy_signal = ((price_up_volume_up & obv_rising & cmf_bullish) |
                     (strong_green_candle & volume_spike) |
                     (near_support_volume & strong_green_candle))
        
        sell_signal = ((price_down_volume_up & obv_falling & cmf_bearish) |
                      (strong_red_candle & volume_spike) |
                      (near_resistance_volume & strong_red_candle))
        
        self.signals['vpa_buy'] = buy_signal
        self.signals['vpa_sell'] = sell_signal
        
        return {
            'name': 'Volume Price Analysis Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Volume and price action analysis with OBV and CMF confirmation'
        }
        
    def macd_rsi_strategy(self):
        """MACD + RSI Crossover Strategy"""
        # MACD signals
        macd_bullish = (self.indicators['macd'] > self.indicators['macd_signal']) & \
                      (self.indicators['macd'].shift(1) <= self.indicators['macd_signal'].shift(1))
        macd_bearish = (self.indicators['macd'] < self.indicators['macd_signal']) & \
                      (self.indicators['macd'].shift(1) >= self.indicators['macd_signal'].shift(1))
        
        # RSI conditions
        rsi_oversold = self.indicators['rsi_14'] < 30
        rsi_overbought = self.indicators['rsi_14'] > 70
        rsi_neutral_bull = (self.indicators['rsi_14'] >= 30) & (self.indicators['rsi_14'] <= 50)
        rsi_neutral_bear = (self.indicators['rsi_14'] >= 50) & (self.indicators['rsi_14'] <= 70)
        
        # Combined signals
        buy_signal = macd_bullish & (rsi_oversold | rsi_neutral_bull)
        sell_signal = macd_bearish & (rsi_overbought | rsi_neutral_bear)
        
        self.signals['macd_rsi_buy'] = buy_signal
        self.signals['macd_rsi_sell'] = sell_signal
        
        return {
            'name': 'MACD + RSI Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Combines MACD crossovers with RSI momentum confirmation'
        }
    
    def ichimoku_rsi_strategy(self):
        """Ichimoku Cloud + RSI Strategy"""
        close = self.indicators['close']
        
        # Ichimoku signals
        price_above_cloud = close > np.maximum(self.indicators['ichimoku_a'], self.indicators['ichimoku_b'])
        price_below_cloud = close < np.minimum(self.indicators['ichimoku_a'], self.indicators['ichimoku_b'])
        
        # Tenkan-Kijun cross
        tenkan_above_kijun = self.indicators['ichimoku_conv'] > self.indicators['ichimoku_base']
        tenkan_below_kijun = self.indicators['ichimoku_conv'] < self.indicators['ichimoku_base']
        
        # RSI confirmation
        rsi_bullish = (self.indicators['rsi_14'] > 50) & (self.indicators['rsi_14'] < 80)
        rsi_bearish = (self.indicators['rsi_14'] < 50) & (self.indicators['rsi_14'] > 20)
        
        # Combined signals
        buy_signal = price_above_cloud & tenkan_above_kijun & rsi_bullish
        sell_signal = price_below_cloud & tenkan_below_kijun & rsi_bearish
        
        self.signals['ichimoku_rsi_buy'] = buy_signal
        self.signals['ichimoku_rsi_sell'] = sell_signal
        
        return {
            'name': 'Ichimoku + RSI Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Uses Ichimoku cloud position with RSI momentum'
        }
    
    def bb_stochastic_strategy(self):
        """Bollinger Bands + Stochastic Oscillator Strategy"""
        close = self.indicators['close']
        
        # Bollinger Bands signals
        bb_oversold = close <= self.indicators['bb_lower_20']
        bb_overbought = close >= self.indicators['bb_upper_20']
        bb_squeeze = self.indicators['bb_width_20'] < self.indicators['bb_width_20'].rolling(20).mean() * 0.8
        
        # Stochastic signals
        stoch_oversold = (self.indicators['stoch_k'] < 20) & (self.indicators['stoch_d'] < 20)
        stoch_overbought = (self.indicators['stoch_k'] > 80) & (self.indicators['stoch_d'] > 80)
        stoch_k_cross_up = (self.indicators['stoch_k'] > self.indicators['stoch_d']) & \
                          (self.indicators['stoch_k'].shift(1) <= self.indicators['stoch_d'].shift(1))
        stoch_k_cross_down = (self.indicators['stoch_k'] < self.indicators['stoch_d']) & \
                           (self.indicators['stoch_k'].shift(1) >= self.indicators['stoch_d'].shift(1))
        
        # Combined signals
        buy_signal = bb_oversold & stoch_oversold & stoch_k_cross_up
        sell_signal = bb_overbought & stoch_overbought & stoch_k_cross_down
        
        # Squeeze breakout
        squeeze_bullish_breakout = bb_squeeze & (close > self.indicators['bb_upper_20']) & \
                                 (self.indicators['volume_momentum'] > 1.2)
        squeeze_bearish_breakout = bb_squeeze & (close < self.indicators['bb_lower_20']) & \
                                 (self.indicators['volume_momentum'] > 1.2)
        
        self.signals['bb_stoch_buy'] = buy_signal | squeeze_bullish_breakout
        self.signals['bb_stoch_sell'] = sell_signal | squeeze_bearish_breakout
        
        return {
            'name': 'Bollinger Bands + Stochastic Strategy',
            'buy_signals': (buy_signal | squeeze_bullish_breakout).sum(),
            'sell_signals': (sell_signal | squeeze_bearish_breakout).sum(),
            'description': 'Combines BB mean reversion with stochastic momentum and squeeze breakouts'
        }
    
    def triple_ema_atr_strategy(self):
        """Triple EMA + ATR Volatility Strategy"""
        # EMA alignment
        ema_bullish_alignment = (self.indicators['ema_8'] > self.indicators['ema_21']) & \
                               (self.indicators['ema_21'] > self.indicators['ema_50'])
        ema_bearish_alignment = (self.indicators['ema_8'] < self.indicators['ema_21']) & \
                               (self.indicators['ema_21'] < self.indicators['ema_50'])
        
        # Price position relative to EMAs
        price_above_all_emas = self.indicators['close'] > self.indicators['ema_8']
        price_below_all_emas = self.indicators['close'] < self.indicators['ema_8']
        
        # ATR volatility filter
        high_volatility = self.indicators['atr_14'] > self.indicators['atr_14'].rolling(20).mean() * 1.2
        normal_volatility = self.indicators['atr_14'] <= self.indicators['atr_14'].rolling(20).mean() * 1.5
        
        # Volume confirmation
        volume_confirmation = self.indicators['volume_momentum'] > 1.1
        
        # Combined signals
        buy_signal = ema_bullish_alignment & price_above_all_emas & normal_volatility & volume_confirmation
        sell_signal = ema_bearish_alignment & price_below_all_emas & normal_volatility & volume_confirmation
        
        self.signals['triple_ema_buy'] = buy_signal
        self.signals['triple_ema_sell'] = sell_signal
        
        return {
            'name': 'Triple EMA + ATR Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Uses EMA alignment with ATR volatility filter and volume confirmation'
        }
    
    def williams_r_cci_strategy(self):
        """Williams %R + CCI Momentum Strategy"""
        # Williams %R signals
        wr_oversold = self.indicators['williams_r'] < -80
        wr_overbought = self.indicators['williams_r'] > -20
        wr_bullish_exit = (self.indicators['williams_r'] > -80) & (self.indicators['williams_r'].shift(1) <= -80)
        wr_bearish_exit = (self.indicators['williams_r'] < -20) & (self.indicators['williams_r'].shift(1) >= -20)
        
        # CCI signals
        cci_oversold = self.indicators['cci'] < -100
        cci_overbought = self.indicators['cci'] > 100
        cci_bullish_cross = (self.indicators['cci'] > -100) & (self.indicators['cci'].shift(1) <= -100)
        cci_bearish_cross = (self.indicators['cci'] < 100) & (self.indicators['cci'].shift(1) >= 100)
        
        # Combined signals
        buy_signal = (wr_oversold & cci_oversold) | (wr_bullish_exit & cci_bullish_cross)
        sell_signal = (wr_overbought & cci_overbought) | (wr_bearish_exit & cci_bearish_cross)
        
        self.signals['wr_cci_buy'] = buy_signal
        self.signals['wr_cci_sell'] = sell_signal
        
        return {
            'name': 'Williams %R + CCI Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Combines Williams %R and CCI for momentum confirmation'
        }
    
    def adx_psar_strategy(self):
        """ADX Trend Strength + PSAR Strategy"""
        close = self.indicators['close']
        
        # ADX trend strength
        strong_trend = self.indicators['adx'] > 25
        weak_trend = self.indicators['adx'] < 20
        
        # ADX direction
        bullish_adx = self.indicators['adx_pos'] > self.indicators['adx_neg']
        bearish_adx = self.indicators['adx_pos'] < self.indicators['adx_neg']
        
        # PSAR signals
        psar_bullish = close > self.indicators['psar']
        psar_bearish = close < self.indicators['psar']
        psar_flip_bullish = psar_bullish & ~psar_bullish.shift(1).fillna(False)
        psar_flip_bearish = psar_bearish & ~psar_bearish.shift(1).fillna(False)
        
        # Combined signals
        buy_signal = strong_trend & bullish_adx & (psar_bullish | psar_flip_bullish)
        sell_signal = strong_trend & bearish_adx & (psar_bearish | psar_flip_bearish)
        
        # Exit on weak trend
        exit_long = weak_trend & psar_flip_bearish
        exit_short = weak_trend & psar_flip_bullish
        
        self.signals['adx_psar_buy'] = buy_signal
        self.signals['adx_psar_sell'] = sell_signal
        self.signals['adx_psar_exit_long'] = exit_long
        self.signals['adx_psar_exit_short'] = exit_short
        
        return {
            'name': 'ADX + PSAR Trend Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Uses ADX for trend strength with PSAR for entry/exit timing'
        }
    
    def volume_price_momentum_strategy(self):
        """Volume-Price-Momentum Confluence Strategy"""
        # Price momentum
        strong_upward_momentum = self.indicators['momentum_20'] > 0.05
        strong_downward_momentum = self.indicators['momentum_20'] < -0.05
        
        # Volume confirmation
        high_volume = self.indicators['volume_momentum'] > 1.5
        
        # Multiple timeframe RSI
        rsi_14_bullish = (self.indicators['rsi_14'] > 40) & (self.indicators['rsi_14'] < 70)
        rsi_21_bullish = (self.indicators['rsi_21'] > 45) & (self.indicators['rsi_21'] < 75)
        rsi_14_bearish = (self.indicators['rsi_14'] > 30) & (self.indicators['rsi_14'] < 60)
        rsi_21_bearish = (self.indicators['rsi_21'] > 25) & (self.indicators['rsi_21'] < 55)
        
        # OBV trend (simplified - would need proper calculation)
        obv_rising = self.indicators['obv'] > self.indicators['obv'].shift(5)
        obv_falling = self.indicators['obv'] < self.indicators['obv'].shift(5)
        
        # Combined signals
        buy_signal = strong_upward_momentum & high_volume & rsi_14_bullish & rsi_21_bullish & obv_rising
        sell_signal = strong_downward_momentum & high_volume & rsi_14_bearish & rsi_21_bearish & obv_falling
        
        self.signals['vpm_buy'] = buy_signal
        self.signals['vpm_sell'] = sell_signal
        
        return {
            'name': 'Volume-Price-Momentum Strategy',
            'buy_signals': buy_signal.sum(),
            'sell_signals': sell_signal.sum(),
            'description': 'Requires confluence of price momentum, volume, multi-timeframe RSI, and OBV'
        }
    
    def fibonacci_support_resistance_strategy(self):
        """Fibonacci Retracement + Support/Resistance Strategy"""
        close = self.indicators['close']
        
        # Fibonacci level interactions
        near_fib_support = abs(close - self.indicators['fib_618']) / close < 0.002
        near_fib_resistance = abs(close - self.indicators['fib_382']) / close < 0.002
        
        # Support/Resistance levels
        near_support = abs(close - self.indicators['support']) / close < 0.01
        near_resistance = abs(close - self.indicators['resistance']) / close < 0.01
        
        # Momentum confirmation at key levels
        rsi_bounce_from_oversold = (self.indicators['rsi_14'] > 35) & (self.indicators['rsi_14'].shift(1) <= 30)
        rsi_reject_from_overbought = (self.indicators['rsi_14'] < 65) & (self.indicators['rsi_14'].shift(1) >= 70)
        
        # Volume spike for breakouts
        volume_spike = self.indicators['volume_momentum'] > 2.0
        
        # Combined signals
        buy_signal = (near_fib_support | near_support) & rsi_bounce_from_oversold
        sell_signal = (near_fib_resistance | near_resistance) & rsi_reject_from_overbought
        
        # Breakout signals
        resistance_breakout = (close > self.indicators['resistance']) & volume_spike
        support_breakdown = (close < self.indicators['support']) & volume_spike
        
        self.signals['fib_sr_buy'] = buy_signal | resistance_breakout
        self.signals['fib_sr_sell'] = sell_signal | support_breakdown
        
        return {
            'name': 'Fibonacci + Support/Resistance Strategy',
            'buy_signals': (buy_signal | resistance_breakout).sum(),
            'sell_signals': (sell_signal | support_breakdown).sum(),
            'description': 'Trades bounces from key levels and breakouts with volume confirmation'
        }
    
    def run_all_strategies(self):
        """Run all trading strategies and return comprehensive analysis"""
        strategies_results = []
        
        # Execute all strategies
        strategies_results.append(self.scalping_ema_strategy())
        strategies_results.append(self.momentum_breakout_strategy())
        strategies_results.append(self.stochastic_divergence_strategy())
        strategies_results.append(self.multi_timeframe_rsi_strategy())
        strategies_results.append(self.williams_r_pullback_strategy())
        strategies_results.append(self.adaptive_bb_strategy())
        strategies_results.append(self.macd_histogram_strategy())
        strategies_results.append(self.volume_price_analysis_strategy())
        strategies_results.append(self.macd_rsi_strategy())
        strategies_results.append(self.ichimoku_rsi_strategy())
        strategies_results.append(self.bb_stochastic_strategy())
        strategies_results.append(self.triple_ema_atr_strategy())
        strategies_results.append(self.williams_r_cci_strategy())
        strategies_results.append(self.adx_psar_strategy())
        strategies_results.append(self.volume_price_momentum_strategy())
        strategies_results.append(self.fibonacci_support_resistance_strategy())
        
        # Get current signals
        current_signals = self.get_current_signals()
        
        # Calculate strategy consensus
        consensus = self.calculate_consensus()
        
        return {
            'strategies_results': strategies_results,
            'current_signals': current_signals,
            'consensus': consensus,
            'signals_df': self.signals
        }
    
    def get_current_signals(self):
        """Get current active signals from all strategies"""
        if len(self.signals) == 0:
            return {}
        
        latest_signals = self.signals.iloc[-1]
        active_signals = {
            'buy_signals': [],
            'sell_signals': [],
            'exit_signals': []
        }
        
        for column in latest_signals.index:
            if latest_signals[column]:
                if 'buy' in column:
                    strategy_name = column.replace('_buy', '').replace('_', ' ').title()
                    active_signals['buy_signals'].append(strategy_name)
                elif 'sell' in column:
                    strategy_name = column.replace('_sell', '').replace('_', ' ').title()
                    active_signals['sell_signals'].append(strategy_name)
                elif 'exit' in column:
                    strategy_name = column.replace('_exit_long', '').replace('_exit_short', '').replace('_', ' ').title()
                    active_signals['exit_signals'].append(strategy_name)
        
        return active_signals
    
    def calculate_consensus(self):
        """Calculate consensus across all strategies"""
        if len(self.signals) == 0:
            return {}
        
        latest_signals = self.signals.iloc[-1]
        
        # Count buy and sell signals
        buy_columns = [col for col in self.signals.columns if 'buy' in col]
        sell_columns = [col for col in self.signals.columns if 'sell' in col and 'exit' not in col]
        
        buy_count = latest_signals[buy_columns].sum()
        sell_count = latest_signals[sell_columns].sum()
        total_strategies = len(buy_columns)
        
        # Calculate percentages
        buy_percentage = (buy_count / total_strategies) * 100
        sell_percentage = (sell_count / total_strategies) * 100
        neutral_percentage = 100 - buy_percentage - sell_percentage
        
        # Determine overall signal
        if buy_percentage >= 60:
            overall_signal = "STRONG BUY"
        elif buy_percentage >= 40:
            overall_signal = "BUY"
        elif sell_percentage >= 60:
            overall_signal = "STRONG SELL"
        elif sell_percentage >= 40:
            overall_signal = "SELL"
        else:
            overall_signal = "NEUTRAL"
        
        return {
            'overall_signal': overall_signal,
            'buy_percentage': buy_percentage,
            'sell_percentage': sell_percentage,
            'neutral_percentage': neutral_percentage,
            'buy_count': int(buy_count),
            'sell_count': int(sell_count),
            'total_strategies': total_strategies,
            'confidence': max(buy_percentage, sell_percentage)
        }

# Integration function to add to your existing system
def add_strategies_to_analysis(df, indicators_df, max_strategies=None):
    """Add strategy analysis to your existing indicator system"""
    try:
        strategy_system = TradingStrategies(df, indicators_df)
        strategy_results = strategy_system.run_all_strategies()
        
        return strategy_results
    
    except Exception as e:
        import traceback
        print(f"Error computing strategies: {e}")
        print(traceback.format_exc())
        return None