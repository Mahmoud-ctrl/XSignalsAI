import os
import json
import numpy as np
import requests
import pandas as pd
from datetime import datetime, timedelta
from binance.client import Client
from HybridAIProcessor import HybridAIProcessor
from indicators import compute_indicators
import time
from DataManager import DataManager
from BTCAnalyzer import BTCAnalyzer
from RiskManager import RiskManager
from DataSerializer import DataSerializer
from PromptGenerator import PromptGenerator

# Initialize Binance client
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)

# Plan configurations
PLAN_LIMITS = {
    'free': {
        'max_pairs': 2,
        'max_scans_per_day': 4,
        'take_profit_levels': 1,
        'ai_models': ['deepseek/deepseek-r1-0528-qwen3-8b:free'],
        'features': ['basic_signals', '5m_1h_timeframes'],
        'show_ai_response': False
    },
    'premium': {
        'max_pairs': 5,
        'max_scans_per_day': 30,
        'take_profit_levels': 2,
        'ai_models': [
            'deepseek/deepseek-r1-0528-qwen3-8b:free',
            'anthropic/claude-3.5-sonnet'
        ],
        'features': ['advanced_signals', 'all_timeframes', 'risk_analysis'],
        'show_ai_response': False
    },
    'pro': {
        'max_pairs': 20,
        'max_scans_per_day': 200,
        'take_profit_levels': 3,
        'ai_models': [
            'deepseek/deepseek-r1-0528-qwen3-8b:free',
            'anthropic/claude-3.5-sonnet',
            'openai/gpt-4-turbo',
            'google/gemini-pro-1.5',
            'meta-llama/llama-3.1-8b-instruct'
        ],
        'features': ['premium_signals', 'all_features', 'priority_support'],
        'show_ai_response': True
    }
}

class ComprehensiveAnalyzer:
    """Main analyzer class that orchestrates all analysis operations"""
    
    def __init__(self, user_plan='free', ai_model=None, user_id=None):
        self.user_plan = user_plan
        self.user_id = user_id
        self.plan_config = PLAN_LIMITS.get(user_plan, PLAN_LIMITS['free'])
        
        # Set AI model
        if ai_model and ai_model in self.plan_config['ai_models']:
            self.ai_model = ai_model
        else:
            self.ai_model = self.plan_config['ai_models'][0]
        
        # Initialize components
        self.data_manager = DataManager(Client(BINANCE_API_KEY, BINANCE_API_SECRET))
        self.btc_analyzer = BTCAnalyzer(self.data_manager)
        self.risk_manager = RiskManager()
        self.prompt_generator = PromptGenerator(self.plan_config)
        self.data_serializer = DataSerializer()
        
        # ADD THIS: Initialize hybrid processor
        self.hybrid_processor = HybridAIProcessor(
            self.plan_config, 
            OPENROUTER_API_KEY, 
            self.ai_model
        )

    def get_available_ai_models(self):
        """Return available AI models for current plan"""
        return self.plan_config['ai_models']
        
    def get_plan_features(self):
        """Return plan configuration"""
        return {
            'plan': self.user_plan,
            'max_pairs': self.plan_config['max_pairs'],
            'max_scans_per_day': self.plan_config['max_scans_per_day'],
            'take_profit_levels': self.plan_config['take_profit_levels'],
            'available_ai_models': self.plan_config['ai_models'],
            'current_ai_model': self.ai_model,
            'features': self.plan_config['features'],
            'show_ai_response': self.plan_config['show_ai_response']
        }
    
    def get_market_context(self, symbol):
        """Return market context for the specified symbol"""
        return self.data_manager.get_market_context(symbol)
    
    def filter_timeframes_by_plan(self, requested_timeframes):
        """Filter timeframes based on plan limitations"""
        if '5m_1h_timeframes' in self.plan_config['features']:
            allowed = ['5m', '1h']
            return [tf for tf in requested_timeframes if tf in allowed]
        else:
            return requested_timeframes
    
    def filter_take_profits_by_plan(self, take_profits):
        """Filter take profit levels based on plan"""
        max_tp_levels = self.plan_config['take_profit_levels']
        
        if not take_profits or not isinstance(take_profits, list):
            return []
        
        return take_profits[:max_tp_levels]

    def get_current_price(self, symbol):
        """Get current price using data manager"""
        return self.data_manager.get_current_price(symbol)

    def get_market_context(self, symbol):
        """Get market context using data manager"""
        return self.data_manager.get_market_context(symbol)

    def analyze_multiple_timeframes(self, symbol, timeframes=['15m', '1h', '4h', '1d'], include_btc=True):
        """Analyze multiple timeframes with optional BTC integration"""
        if include_btc and symbol != 'BTCUSDT':
            return self._analyze_with_btc(symbol, timeframes)
        else:
            return self._analyze_without_btc(symbol, timeframes)

    def _analyze_with_btc(self, symbol, timeframes):
        """Enhanced multi-timeframe analysis with BTC correlation"""
        allowed_timeframes = self.filter_timeframes_by_plan(timeframes)
        
        # Get BTC context and correlation
        btc_context = self.btc_analyzer.get_btc_context(allowed_timeframes)
        btc_correlation = self.btc_analyzer.calculate_btc_correlation(symbol)
        
        results = {}
        
        for tf in allowed_timeframes:
            print(f"Analyzing {symbol} on {tf} timeframe...")
            
            limit = 200 if tf == '1d' else 300
            df = self.data_manager.fetch_historical_data(symbol, tf, limit=limit)
            
            if df is None:
                continue
            
            btc_df = self.data_manager.fetch_historical_data('BTCUSDT', tf, limit=limit)
            latest, analysis, full_df = compute_indicators(df, btc_df)
            
            if latest is not None and analysis is not None:
                latest_dict = self._serialize_latest_data(latest)
                serialized_analysis = self.data_serializer.serialize_analysis_data(analysis)
                
                results[tf] = {
                    'latest': latest_dict,
                    'analysis': serialized_analysis,
                    'data_points': len(full_df) if full_df is not None else 0,
                    'btc_context': btc_context.get(tf),
                    'btc_correlation': btc_correlation
                }
            
            time.sleep(0.1)
        
        # Add cross-timeframe BTC analysis
        results['btc_influence'] = self.btc_analyzer.analyze_btc_influence(results, btc_context, btc_correlation)
        
        return results

    def _analyze_without_btc(self, symbol, timeframes):
        """Original analysis without BTC integration"""
        allowed_timeframes = self.filter_timeframes_by_plan(timeframes)
        
        results = {}
        
        for tf in allowed_timeframes:
            print(f"Analyzing {symbol} on {tf} timeframe...")
            
            limit = 200 if tf == '1d' else 300
            df = self.data_manager.fetch_historical_data(symbol, tf, limit=limit)
            
            if df is None:
                continue
            
            latest, analysis, full_df = compute_indicators(df)
            
            if latest is not None and analysis is not None:
                latest_dict = self._serialize_latest_data(latest)
                serialized_analysis = self.data_serializer.serialize_analysis_data(analysis)
                
                results[tf] = {
                    'latest': latest_dict,
                    'analysis': serialized_analysis,
                    'data_points': len(full_df) if full_df is not None else 0
                }
            
            time.sleep(0.1)
        
        return results

    def _serialize_latest_data(self, latest):
        """Serialize latest data dictionary"""
        latest_dict = {}
        for key, value in latest.items():
            if pd.isna(value):
                latest_dict[key] = None
            elif hasattr(value, 'item'):
                latest_dict[key] = value.item()
            else:
                latest_dict[key] = value
        return latest_dict
    
    def _extract_risk_data(self, multi_tf_analysis, primary_tf, current_price):
        """Extract risk management data from analysis"""
        if primary_tf in multi_tf_analysis:
            atr = multi_tf_analysis[primary_tf]['latest'].get('atr_14', current_price * 0.02)
            support = multi_tf_analysis[primary_tf]['latest'].get('support', np.nan)
            resistance = multi_tf_analysis[primary_tf]['latest'].get('resistance', np.nan)
        else:
            atr = current_price * 0.02
            support = np.nan
            resistance = np.nan
        return atr, support, resistance

    def query_ai_analysis(self, symbol, multi_tf_analysis, market_context=None, use_btc_analysis=True):
        """Enhanced AI analysis method using hybrid approach"""
        try:
            current_price = self.get_current_price(symbol)
            if not current_price:
                return "Error: Could not get current price"
            
            # Get risk management data
            primary_tf = '4h' if '4h' in multi_tf_analysis else list(multi_tf_analysis.keys())[0]
            atr, support, resistance = self._extract_risk_data(multi_tf_analysis, primary_tf, current_price)
            
            # Use hybrid processor for AI analysis
            result = self.hybrid_processor.get_hybrid_analysis(
                symbol, 
                multi_tf_analysis, 
                market_context, 
                current_price,
                atr, 
                support, 
                resistance, 
                primary_tf, 
                use_btc_analysis and symbol != 'BTCUSDT'
            )
            
            if result['success']:
                # Apply final risk management checks
                trade_plan = self._apply_final_risk_checks(
                    result['trade_plan'], 
                    current_price, 
                    atr, 
                    support, 
                    resistance, 
                    primary_tf
                )
                
                # Format response based on user plan
                response_data = {
                    'trade_plan': trade_plan,
                    'method': result['method'],
                    'success': True
                }
                
                # Add detailed analysis for pro users
                if result['detailed_analysis'] and self.plan_config.get('show_ai_response', False):
                    response_data['detailed_analysis'] = result['detailed_analysis']
                    response_data['pro_features'] = True
                
                return json.dumps(response_data, indent=2)
            
            else:
                return f"Analysis failed: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            return f"Error during hybrid AI analysis: {str(e)}"

    def _apply_final_risk_checks(self, trade_plan, current_price, atr, support, resistance, primary_tf):
        """Apply final risk management validation"""
        
        # Validate stop loss distance
        if 'stop_loss' in trade_plan and 'entry_zone' in trade_plan:
            entry_mid = sum(trade_plan['entry_zone']) / 2
            stop_distance_pct = abs(trade_plan['stop_loss'] - entry_mid) / entry_mid * 100
            
            # If stop is too far, recalculate
            if stop_distance_pct > 3.5:  # Max 3.5% stop loss
                if trade_plan.get('primary_signal') == 'BUY':
                    trade_plan['stop_loss'] = entry_mid - (entry_mid * 0.03)  # 3% below
                elif trade_plan.get('primary_signal') == 'SELL':
                    trade_plan['stop_loss'] = entry_mid + (entry_mid * 0.03)  # 3% above
                
                trade_plan['stop_loss_adjusted'] = True
        
        # Validate take profit count matches plan
        if 'take_profits' in trade_plan:
            max_tps = self.plan_config['take_profit_levels']
            if len(trade_plan['take_profits']) > max_tps:
                trade_plan['take_profits'] = trade_plan['take_profits'][:max_tps]
                trade_plan['tp_limited_by_plan'] = True
        
        # Add entry validation
        if current_price and 'entry_zone' in trade_plan:
            validation = self.risk_manager.validate_entry_opportunity(
                current_price, 
                trade_plan['entry_zone'], 
                trade_plan.get('primary_signal', 'WAIT')
            )
            trade_plan['entry_validation'] = validation
        
        return trade_plan

    def check_usage_limits(self, user_id, current_hour):
        """Check if user has exceeded plan limits (implement based on your storage)"""
        # This is pseudocode - implement based on your database/storage
        # current_scans = get_user_scans_this_hour(user_id, current_hour)
        # max_scans = self.plan_config['max_scans_per_day']
        # return current_scans < max_scans
        return True  # For now, always allow

    def log_usage(self, user_id, symbol, analysis_type):
        """Log usage for plan tracking"""
        # Implement based on your logging system
        print(f"Usage: {user_id} analyzed {symbol} with {analysis_type}")
