# enhanced_smart_analysis_decisive.py - Integration with a focus on ACTIONABLE decisions

import pandas as pd
import numpy as np
import ta
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import json

class MarketRegime(Enum):
    STRONG_UPTREND = "strong_uptrend"
    WEAK_UPTREND = "weak_uptrend"
    RANGING = "ranging"
    WEAK_DOWNTREND = "weak_downtrend"
    STRONG_DOWNTREND = "strong_downtrend"
    HIGH_VOLATILITY = "high_volatility"

@dataclass
class TradingSignal:
    signal: str  # BUY, SELL, HOLD_OFF
    confidence: float  # 0-10 
    entry_zone: Tuple[float, float]
    stop_loss: float
    take_profits: List[float]
    reasoning: List[str]
    invalidation_conditions: List[str]
    regime_context: MarketRegime
    actionable_decision: str  # EXECUTE_NOW, HOLD_OFF

class FocusedTradingAnalyzer:
    """
    Streamlined analyzer using essential indicators, designed for decisive, actionable output.
    """
    
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.current_price = df['close'].iloc[-1]
        self.regime = None
        self.indicators = {}
        
    def calculate_essential_indicators(self):
        """Only the indicators that ACTUALLY matter for a decision"""
        close = self.df['close']
        high = self.df['high']
        low = self.df['low']
        volume = self.df['volume']
        
        # TREND (3 indicators max)
        self.indicators['ema_12'] = ta.trend.EMAIndicator(close, window=12).ema_indicator()
        self.indicators['ema_26'] = ta.trend.EMAIndicator(close, window=26).ema_indicator()
        self.indicators['ema_50'] = ta.trend.EMAIndicator(close, window=50).ema_indicator()
        
        # MOMENTUM (3 indicators max)
        self.indicators['rsi'] = ta.momentum.RSIIndicator(close, window=14).rsi()
        macd = ta.trend.MACD(close)
        self.indicators['macd'] = macd.macd()
        self.indicators['macd_signal'] = macd.macd_signal()
        self.indicators['macd_histogram'] = macd.macd_diff()
        
        # VOLATILITY (2 indicators max)
        self.indicators['atr'] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()
        bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
        self.indicators['bb_upper'] = bb.bollinger_hband()
        self.indicators['bb_middle'] = bb.bollinger_mavg()
        self.indicators['bb_lower'] = bb.bollinger_lband()
        
        # VOLUME (1 indicator)
        self.indicators['volume_ratio'] = volume / volume.rolling(20).mean()
        
        # MARKET STRUCTURE (essential levels)
        self.indicators['support'] = self.calculate_support()
        self.indicators['resistance'] = self.calculate_resistance()
        
    def detect_market_regime(self) -> MarketRegime:
        """Detect current market regime"""
        close = self.df['close']
        ema_12 = self.indicators['ema_12']
        ema_26 = self.indicators['ema_26']
        ema_50 = self.indicators['ema_50']
        atr = self.indicators['atr']
        
        current_close = close.iloc[-1]
        current_atr = atr.iloc[-1]
        
        trend_strength = (current_close - ema_50.iloc[-1]) / ema_50.iloc[-1] * 100
        volatility_pct = (current_atr / current_close) * 100
        
        if volatility_pct > 5:
            return MarketRegime.HIGH_VOLATILITY
        elif trend_strength > 2 and ema_12.iloc[-1] > ema_26.iloc[-1] > ema_50.iloc[-1]:
            return MarketRegime.STRONG_UPTREND
        elif trend_strength > 0.5 and ema_12.iloc[-1] > ema_26.iloc[-1]:
            return MarketRegime.WEAK_UPTREND
        elif trend_strength < -2 and ema_12.iloc[-1] < ema_26.iloc[-1] < ema_50.iloc[-1]:
            return MarketRegime.STRONG_DOWNTREND
        elif trend_strength < -0.5 and ema_12.iloc[-1] < ema_26.iloc[-1]:
            return MarketRegime.WEAK_DOWNTREND
        else:
            return MarketRegime.RANGING
    
    def calculate_support(self) -> float:
        """Calculate dynamic support"""
        low = self.df['low']
        if self.regime in [MarketRegime.STRONG_UPTREND, MarketRegime.WEAK_UPTREND]:
            recent_low = low.rolling(20).min().iloc[-1]
            ema_support = self.indicators['ema_12'].iloc[-1] * 0.98
            return max(recent_low, ema_support)
        else:
            return low.rolling(50).min().iloc[-1]
    
    def calculate_resistance(self) -> float:
        """Calculate dynamic resistance"""
        high = self.df['high']
        if self.regime in [MarketRegime.STRONG_DOWNTREND, MarketRegime.WEAK_DOWNTREND]:
            recent_high = high.rolling(20).max().iloc[-1]
            ema_resistance = self.indicators['ema_12'].iloc[-1] * 1.02
            return min(recent_high, ema_resistance)
        else:
            return high.rolling(50).max().iloc[-1]
    
    def get_best_strategies(self):
        """Get ONLY the 2-3 best strategies that work for this regime"""
        current_price = self.current_price
        indicators = self.indicators
        rsi = indicators['rsi'].iloc[-1]
        macd = indicators['macd'].iloc[-1]
        macd_signal = indicators['macd_signal'].iloc[-1]
        
        active_strategies = []
        
        if self.regime in [MarketRegime.STRONG_UPTREND, MarketRegime.WEAK_UPTREND]:
            if (indicators['ema_12'].iloc[-1] > indicators['ema_26'].iloc[-1] and rsi > 40):
                active_strategies.append({'name': 'EMA_RSI_Trend','signal': 'BUY','confidence': 8 if self.regime == MarketRegime.STRONG_UPTREND else 6,'reasoning': 'EMA alignment with healthy RSI in uptrend'})
        elif self.regime in [MarketRegime.STRONG_DOWNTREND, MarketRegime.WEAK_DOWNTREND]:
            if (indicators['ema_12'].iloc[-1] < indicators['ema_26'].iloc[-1] and rsi < 60):
                active_strategies.append({'name': 'EMA_RSI_Trend','signal': 'SELL','confidence': 8 if self.regime == MarketRegime.STRONG_DOWNTREND else 6,'reasoning': 'EMA decline with healthy RSI in downtrend'})
        
        if macd > macd_signal and indicators['volume_ratio'].iloc[-1] > 1.1:
            active_strategies.append({'name': 'MACD_Volume','signal': 'BUY','confidence': 7,'reasoning': 'MACD crossover with volume confirmation'})
        elif macd < macd_signal and indicators['volume_ratio'].iloc[-1] > 1.1:
            active_strategies.append({'name': 'MACD_Volume','signal': 'SELL','confidence': 7,'reasoning': 'MACD bearish with volume confirmation'})
        
        if self.regime == MarketRegime.RANGING:
            bb_position = (current_price - indicators['bb_lower'].iloc[-1]) / (indicators['bb_upper'].iloc[-1] - indicators['bb_lower'].iloc[-1])
            if bb_position <= 0.2 and rsi < 35:
                active_strategies.append({'name': 'BB_Reversion','signal': 'BUY','confidence': 7,'reasoning': 'Oversold bounce in ranging market'})
            elif bb_position >= 0.8 and rsi > 65:
                active_strategies.append({'name': 'BB_Reversion','signal': 'SELL','confidence': 7,'reasoning': 'Overbought rejection in ranging market'})
        
        return active_strategies
    
    def generate_signal(self, current_market_price=None) -> Dict:
        """Generate the final trading signal in your API format"""
        self.calculate_essential_indicators()
        self.regime = self.detect_market_regime()
        strategies = self.get_best_strategies()
        
        buy_signals = [s for s in strategies if s['signal'] == 'BUY']
        sell_signals = [s for s in strategies if s['signal'] == 'SELL']
        
        if len(buy_signals) >= 1 and not sell_signals:
            primary_signal = 'BUY'
            confidence = max([s['confidence'] for s in buy_signals])
        elif len(sell_signals) >= 1 and not buy_signals:
            primary_signal = 'SELL'
            confidence = max([s['confidence'] for s in sell_signals])
        else:
            primary_signal = 'HOLD_OFF'
            confidence = 4
        
        if primary_signal == 'BUY':
            entry_zone = [self.current_price * 0.99, self.current_price * 1.01]
            stop_loss = self.indicators['support'] * 0.98
            take_profits = [self.current_price * 1.02, self.current_price * 1.04, self.indicators['resistance'] * 0.98]
        elif primary_signal == 'SELL':
            entry_zone = [self.current_price * 0.99, self.current_price * 1.01]
            stop_loss = self.indicators['resistance'] * 1.02
            take_profits = [self.current_price * 0.98, self.current_price * 0.96, self.indicators['support'] * 1.02]
        else:
            entry_zone = [0, 0]
            stop_loss = 0
            take_profits = []
        
        actionable_decision = self.get_actionable_decision(current_market_price, entry_zone, primary_signal)
        
        return {
            'primary_signal': primary_signal,
            'confidence': confidence,
            'entry_zone': entry_zone,
            'stop_loss': stop_loss,
            'take_profits': take_profits,
            'actionable_decision': actionable_decision, # MODIFIED KEY
            'regime': self.regime.value,
            'active_strategies': strategies,
            'key_levels': {
                'support': self.indicators['support'],
                'resistance': self.indicators['resistance'],
                'current_price': self.current_price
            },
            'reasoning': self.generate_reasoning(strategies, primary_signal)
        }
    
    def get_actionable_decision(self, current_market_price, entry_zone, signal_type):
        """
        NEW: This function makes a decisive call: EXECUTE NOW or HOLD OFF.
        It replaces the cautious 'validate_entry_status'.
        """
        if not current_market_price or not entry_zone or entry_zone == [0, 0] or signal_type == 'HOLD_OFF':
            return 'HOLD_OFF'
        
        entry_low, entry_high = entry_zone
        
        # Widen the tolerance for what is considered an actionable price
        actionable_range_multiplier = 1.015 # Allow 1.5% leeway
        
        if signal_type == 'BUY':
            # Is the price below the ideal entry high? If so, it's a go.
            if current_market_price <= entry_high * actionable_range_multiplier:
                return 'EXECUTE_NOW'
            else: # Price has run away too much
                return 'HOLD_OFF'
                
        elif signal_type == 'SELL':
            # Is the price above the ideal entry low? If so, it's a go.
            if current_market_price >= entry_low / actionable_range_multiplier:
                return 'EXECUTE_NOW'
            else: # Price has dropped too much already
                return 'HOLD_OFF'
        
        return 'HOLD_OFF'
    
    def generate_reasoning(self, strategies, signal):
        """Generate human-readable reasoning"""
        reasoning = [f"Market regime: {self.regime.value}"]
        for strategy in strategies:
            if strategy['signal'] == signal:
                reasoning.append(f"{strategy['name']}: {strategy['reasoning']}")
        if not any(s for s in strategies if s['signal'] == signal):
            reasoning.append("No strong strategy alignment for an immediate trade.")
        return reasoning

# Main integration function
def compute_smart_analysis_decisive(df, timeframe='1h', current_market_price=None):
    """
    Main function to replace compute_indicators, returns decisive analysis.
    """
    try:
        analyzer = FocusedTradingAnalyzer(df)
        result = analyzer.generate_signal(current_market_price)
        result['timeframe'] = timeframe
        
        latest_dict = {
            'close': analyzer.current_price,
            'rsi_14': analyzer.indicators['rsi'].iloc[-1],
            'macd': analyzer.indicators['macd'].iloc[-1],
            'support': analyzer.indicators['support'],
            'resistance': analyzer.indicators['resistance'],
            'bb_position': (analyzer.current_price - analyzer.indicators['bb_lower'].iloc[-1]) / 
                          (analyzer.indicators['bb_upper'].iloc[-1] - analyzer.indicators['bb_lower'].iloc[-1]),
            'volume_momentum': analyzer.indicators['volume_ratio'].iloc[-1]
        }
        
        analysis = {
            'overall_signal': {
                'signal': result['primary_signal'],
                'confidence': result['confidence'] * 10,
                'score': result['confidence'] - 5
            },
            'smart_analysis': result
        }
        
        return latest_dict, analysis, df
        
    except Exception as e:
        print(f"Error in decisive smart analysis: {e}")
        return None, None, None
