
class PromptGenerator:
    """Handles AI prompt generation and formatting"""
    
    def __init__(self, plan_config):
        self.plan_config = plan_config
    
    def format_comprehensive_prompt(self, symbol, multi_tf_analysis, market_context, current_price=None):
        """Format the comprehensive analysis prompt with aggressive decision-making and detailed insights"""
        from datetime import datetime
        
        # Extract strategy insights
        strategy_insights = self.extract_strategy_insights(multi_tf_analysis)
        
        # Get ATR for risk calculations
        primary_tf = '4h' if '4h' in multi_tf_analysis else list(multi_tf_analysis.keys())[0]
        atr_value = None
        if primary_tf in multi_tf_analysis:
            atr_value = multi_tf_analysis[primary_tf]['latest'].get('atr_14', None)
        
        prompt = f"""
    🚀 AGGRESSIVE CRYPTO TRADE ANALYSIS ({self.plan_config.get('user_plan', 'FREE').upper()} Plan)

    SYMBOL: {symbol}
    TIMESTAMP: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
    🔥 CURRENT LIVE PRICE: ${current_price:.2f} (CRITICAL FOR ENTRY VALIDATION)
    💣 PRIMARY ATR ({primary_tf}): {atr_value:.4f} ({(atr_value/current_price)*100:.2f}% volatility)

    PLAN RULES:
    • Take Profit Levels: {self.plan_config['take_profit_levels']}
    • Position Sizing: {self.plan_config.get('position_sizing', '0.5-2%')}

    ═══════════════════════════════════════════════════════════════════

    📊 MULTI-TIMEFRAME TECHNICAL ANALYSIS:
    """
        
        # Add each timeframe analysis
        for tf, data in multi_tf_analysis.items():
            if 'analysis' not in data:
                continue

            analysis = data['analysis']
            latest = data['latest']

            prompt += f"""
    ┌─ {tf.upper()} TIMEFRAME ─┐
    │ 💰 Price: ${latest['close']:.6f}
    │ 🎯 Signal: {analysis['overall_signal']['signal']} ({analysis['overall_signal']['confidence']:.1f}%)
    │ 📊 Score: {analysis['overall_signal']['score']:.2f}
    │
    │ 🎯 TREND: {analysis['trend_analysis']['strength']} ({analysis['trend_analysis']['score']})
    │ ⚡ MOMENTUM: {analysis['momentum_analysis']['strength']} ({analysis['momentum_analysis']['score']})
    │ 📊 RSI: {latest['rsi_14']:.1f} | MACD: {latest['macd']:.6f}
    │ 🎢 BB Position: {analysis['volatility_analysis']['bb_position']:.2f}
    │ 📈 Volume: {latest['volume_momentum']:.1f}x avg
    │ 🎯 Support: ${latest['support']:.6f} | Resistance: ${latest['resistance']:.6f}
    │ 🕯️ Patterns: {', '.join(analysis['pattern_analysis']['patterns'][:2])}
    │ 💣 ATR: {latest.get('atr_14', 0):.4f}
    """
            
            # Add comprehensive strategy analysis
            if 'strategies' in analysis and analysis['strategies']:
                strategies = analysis['strategies']
                consensus = strategies.get('consensus', {})
                current_signals = strategies.get('current_signals', {})
                
                prompt += f"""│
    │ 🚨 STRATEGY CONSENSUS:
    │ Overall: {consensus.get('overall_signal', 'N/A')} ({consensus.get('confidence', 0):.1f}%)
    │ Buy: {consensus.get('buy_percentage', 0):.1f}% | Sell: {consensus.get('sell_percentage', 0):.1f}%
    │ Active: {consensus.get('buy_count', 0)}🟢 {consensus.get('sell_count', 0)}🔴 / {consensus.get('total_strategies', 0)} strategies
    """
                
                if current_signals.get('buy_signals'):
                    buy_strategies = current_signals['buy_signals'][:4]
                    prompt += f"│ 🟢 BUY Strategies: {', '.join(buy_strategies)}\n"
                    
                if current_signals.get('sell_signals'):
                    sell_strategies = current_signals['sell_signals'][:4]
                    prompt += f"│ 🔴 SELL Strategies: {', '.join(sell_strategies)}\n"
                    
                if current_signals.get('exit_signals'):
                    exit_strategies = current_signals['exit_signals'][:3]
                    prompt += f"│ ⚠️ EXIT Signals: {', '.join(exit_strategies)}\n"

            prompt += "└────────────────────────────┘\n"

        # Add market context if available
        if market_context:
            prompt += f"""
    🌍 MARKET CONTEXT:
    • Current Price: ${market_context['current_price']:.6f}
    • 24h Change: {market_context['price_change_24h']:+.2f}%
    • 24h Volume: {market_context['volume_24h']:,.0f}
    • 24h Range: ${market_context['low_24h']:.6f} - ${market_context['high_24h']:.6f}
    • Bid-Ask Spread: {market_context['bid_ask_spread']:.4f}%
    • Trade Count: {market_context['trade_count_24h']:,}
    """

        # Add BTC analysis if available
        btc_influence = multi_tf_analysis.get('btc_influence', {})
        if btc_influence:
            prompt += self._format_btc_analysis_section(multi_tf_analysis, btc_influence)

        prompt += f"""
    ═══════════════════════════════════════════════════════════════════

    💣 CRITICAL EXECUTION RULES (AGGRESSIVE TRADER - NO EXCEPTIONS):

    🚨 STOP LOSS RULES:
    • MUST be ≤ 3% from entry and on CORRECT side:
    - BUY trades: SL BELOW entry zone (price goes down = loss)
    - SELL trades: SL ABOVE entry zone (price goes up = loss)
    • Use 1.5-2x ATR ({atr_value:.4f}) for stop placement unless tier rules require tighter
    • If SL direction is wrong, auto-correct using ATR + tier rules

    🎯 RISK-REWARD RULES:
    • Minimum R:R = 1:2 (NO EXCEPTIONS)
    • EXACTLY {self.plan_config['take_profit_levels']} take profit levels
    • Position sizing: {self.plan_config.get('position_sizing', '0.5-2%')} of portfolio

    💀 DECISION RULES:
    • NO "maybe" or "wait and see" - COMMIT TO A DECISION
    • Avoid "no trade" unless signals completely contradict
    • Be AGGRESSIVE - traders want ACTION, not caution
    • If entry missed, be BRUTAL - say "ENTRY DEAD" or give specific pullback levels

    🚨🚨 CRITICAL ENTRY VALIDATION REQUIRED 🚨🚨

    The current LIVE price is ${current_price:.2f}

    Based on the multi-timeframe technical and strategy data above, provide AGGRESSIVE expert analysis with:

    1. 🚨 IMMEDIATE ENTRY VALIDATION
    2. 📊 STRATEGY CONVERGENCE ANALYSIS  
    3. 🎯 AGGRESSIVE TRADE RECOMMENDATION
    4. ⚡ STRATEGY-SPECIFIC INSIGHTS
    5. ⚠️ RISK MANAGEMENT & CONFLICTS
    6. 📈 MARKET PSYCHOLOGY & EXECUTION
    7. ⏰ AGGRESSIVE EXECUTION PLAN
    8. 💀 BRUTAL HONESTY SECTION

    At the end, provide this EXACT JSON format:

    {{
    "entry_status": "ENTER_NOW/WAIT_FOR_PULLBACK/ENTRY_MISSED/ENTRY_DEAD",
    "current_vs_entry": "Specific comparison with numbers",
    "action_required": "Exact action to take right now",
    "primary_signal": "BUY/SELL/WAIT",
    "confidence": 1-10,
    "entry_zone": [low_price, high_price],
    "stop_loss": exact_stop_price,
    "take_profits": [tp1, tp2, tp3],
    "risk_reward_ratio": "1:X.X",
    "timeframe": "best execution timeframe",
    "risk_level": "LOW/MEDIUM/HIGH",
    "trade_duration": "SHORT/MEDIUM/LONG",
    "strategy_consensus": "X% agreement",
    "dominant_strategies": ["ranked list of top strategies"],
    "strategy_conflicts": "brief description or NONE",
    "strategy_confidence": 1-10,
    "cross_timeframe_alignment": "X% aligned",
    "invalidation_triggers": ["exact price levels where strategies fail"],
    "position_sizing": "{self.plan_config.get('position_sizing', '0.5-2%')}",
    "pullback_levels": ["exact levels if waiting for pullback"],
    "atr_stop_distance": "{atr_value:.4f} (used for stop calculation)",
    "execution_method": "MARKET/LIMIT/DCA",
    "trade_rejected": false
    }}

    💀 NO PUSSY TRADING - COMMIT TO DECISIONS AND BE SPECIFIC WITH NUMBERS!
    """
        
        return prompt

    def _format_btc_analysis_section(self, multi_tf_analysis, btc_influence):
        """Format BTC analysis section for prompt"""
        btc_section = f"""
    ═══════════════════════════════════════════════════════════════════
    🔶 BTC CORRELATION & MARKET INFLUENCE ANALYSIS:

    🔶 BTC INFLUENCE ASSESSMENT:
    • Overall Influence: {btc_influence.get('influence', 'Unknown').upper()}
    • Risk Level: {btc_influence.get('risk_level', 'Unknown').upper()}
    • Confidence Adjustment: {btc_influence.get('confidence_adjustment', 0):+d}%
    • Position Size: {btc_influence.get('position_size_adjustment', 'normal').upper()}

    🚨 BTC RISK FACTORS:"""
        
        risk_factors = btc_influence.get('risk_factors', [])
        if risk_factors:
            for risk in risk_factors[:3]:
                btc_section += f"""
    • {risk}"""
        else:
            btc_section += """
    • No significant BTC risk factors identified"""

        btc_section += f"""

    ✅ BTC OPPORTUNITIES:"""
        
        opportunities = btc_influence.get('opportunities', [])
        if opportunities:
            for opp in opportunities[:3]:
                btc_section += f"""
    • {opp}"""
        else:
            btc_section += """
    • No specific BTC opportunities identified"""

        return btc_section

    def extract_strategy_insights(self, multi_tf_analysis):
        """Extract strategy insights from multi-timeframe analysis"""
        strategy_summary = {
            'cross_timeframe_consensus': {},
            'strategy_strength_by_tf': {},
            'conflicting_signals': [],
            'high_confidence_strategies': [],
            'strategy_patterns': {}
        }
        
        for tf, data in multi_tf_analysis.items():
            if 'analysis' not in data or 'strategies' not in data['analysis']:
                continue
                
            strategies = data['analysis']['strategies']
            if not strategies:
                continue
                
            consensus = strategies.get('consensus', {})
            current_signals = strategies.get('current_signals', {})
            
            strategy_summary['strategy_strength_by_tf'][tf] = {
                'overall_signal': consensus.get('overall_signal', 'NEUTRAL'),
                'confidence': consensus.get('confidence', 0),
                'buy_percentage': consensus.get('buy_percentage', 0),
                'sell_percentage': consensus.get('sell_percentage', 0),
                'active_buy_strategies': current_signals.get('buy_signals', []),
                'active_sell_strategies': current_signals.get('sell_signals', []),
                'exit_signals': current_signals.get('exit_signals', [])
            }
            
            if consensus.get('confidence', 0) > 65:
                strategy_summary['high_confidence_strategies'].append({
                    'timeframe': tf,
                    'signal': consensus.get('overall_signal'),
                    'confidence': consensus.get('confidence'),
                    'top_strategies': current_signals.get('buy_signals', []) + current_signals.get('sell_signals', [])
                })
        
        return strategy_summary