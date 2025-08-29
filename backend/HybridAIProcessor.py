import json
import re
from typing import Dict, Any, Optional, Tuple
import requests

class AIResponseHandler:
    """Enhanced handler for AI responses with fallback strategies"""
    
    def __init__(self, plan_config):
        self.plan_config = plan_config
        self.show_ai_response = plan_config.get('show_ai_response', False)
    
    def process_ai_response(self, ai_response: str, multi_tf_analysis: Dict, 
                          current_price: float, atr: float, support: float, 
                          resistance: float, primary_tf: str, has_btc: bool = False) -> Dict[str, Any]:
        """
        Process AI response with multiple fallback strategies
        Returns dict with 'success', 'trade_plan', 'detailed_analysis', and 'error'
        """
        result = {
            'success': False,
            'trade_plan': None,
            'detailed_analysis': None,
            'error': None,
            'parsing_method': None
        }
        
        try:
            # Strategy 1: Try to extract JSON from response
            trade_plan = self._extract_json_from_response(ai_response)
            
            if trade_plan:
                result.update({
                    'success': True,
                    'trade_plan': self._validate_and_enhance_trade_plan(
                        trade_plan, multi_tf_analysis, current_price, atr, 
                        support, resistance, primary_tf, has_btc
                    ),
                    'detailed_analysis': ai_response if self.show_ai_response else None,
                    'parsing_method': 'json_extraction'
                })
                return result
            
            # Strategy 2: Try structured text parsing
            trade_plan = self._parse_structured_text(ai_response, current_price)
            
            if trade_plan:
                result.update({
                    'success': True,
                    'trade_plan': self._validate_and_enhance_trade_plan(
                        trade_plan, multi_tf_analysis, current_price, atr,
                        support, resistance, primary_tf, has_btc
                    ),
                    'detailed_analysis': ai_response if self.show_ai_response else None,
                    'parsing_method': 'text_parsing'
                })
                return result
            
            # Strategy 3: Generate fallback trade plan
            trade_plan = self._generate_fallback_trade_plan(
                multi_tf_analysis, current_price, atr, support, resistance, primary_tf
            )
            
            result.update({
                'success': True,
                'trade_plan': trade_plan,
                'detailed_analysis': ai_response if self.show_ai_response else None,
                'parsing_method': 'fallback_generated',
                'error': 'AI response could not be parsed, generated technical fallback'
            })
            
        except Exception as e:
            result['error'] = f"Failed to process AI response: {str(e)}"
            
        return result
    
    def _extract_json_from_response(self, response: str) -> Optional[Dict]:
        """Extract JSON from AI response using multiple patterns"""
        
        # Pattern 1: Look for JSON block wrapped in ```json or ```
        json_patterns = [
            r'```json\n(.*?)\n```',
            r'```\n(\{.*?\})\n```',
            r'```(\{.*?\})```',
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, response, re.DOTALL | re.IGNORECASE)
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue
        
        # Pattern 2: Look for standalone JSON object
        json_object_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_object_pattern, response, re.DOTALL)
        
        # Try matches from longest to shortest (more likely to be complete)
        for match in sorted(matches, key=len, reverse=True):
            try:
                parsed = json.loads(match.strip())
                # Validate it has key fields we expect
                if self._has_required_trade_fields(parsed):
                    return parsed
            except json.JSONDecodeError:
                continue
        
        # Pattern 3: Extract key-value pairs and construct JSON
        return self._extract_key_value_pairs(response)
    
    def _has_required_trade_fields(self, data: Dict) -> bool:
        """Check if parsed JSON has minimum required trade fields"""
        required_fields = ['primary_signal', 'entry_zone', 'confidence']
        return all(field in data for field in required_fields)
    
    def _extract_key_value_pairs(self, response: str) -> Optional[Dict]:
        """Extract key-value pairs from response and construct trade plan"""
        trade_plan = {}
        
        # Define patterns for key trading fields
        patterns = {
            'primary_signal': r'"?primary_signal"?\s*[:=]\s*"?(BUY|SELL|WAIT)"?',
            'entry_zone': r'"?entry_zone"?\s*[:=]\s*\[([^\]]+)\]',
            'stop_loss': r'"?stop_loss"?\s*[:=]\s*([0-9.]+)',
            'confidence': r'"?confidence"?\s*[:=]\s*([0-9.]+)',
            'take_profits': r'"?take_profits"?\s*[:=]\s*\[([^\]]+)\]',
            'risk_reward_ratio': r'"?risk_reward_ratio"?\s*[:=]\s*"?([0-9.:]+)"?',
            'timeframe': r'"?timeframe"?\s*[:=]\s*"?([0-9][mhd])"?',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                value = match.group(1).strip().strip('"\'')
                
                if key in ['entry_zone', 'take_profits']:
                    # Parse array values
                    try:
                        numbers = [float(x.strip()) for x in value.split(',')]
                        trade_plan[key] = numbers
                    except ValueError:
                        continue
                elif key == 'confidence':
                    try:
                        trade_plan[key] = float(value)
                    except ValueError:
                        continue
                elif key == 'stop_loss':
                    try:
                        trade_plan[key] = float(value)
                    except ValueError:
                        continue
                else:
                    trade_plan[key] = value
        
        return trade_plan if len(trade_plan) >= 3 else None
    
    def _parse_structured_text(self, response: str, current_price: float) -> Optional[Dict]:
        """Parse structured text response for trade information"""
        trade_plan = {}
        
        # Look for signal decisions
        signal_patterns = [
            r'(?:RECOMMENDATION|SIGNAL|ACTION):\s*(BUY|SELL|WAIT)',
            r'(BUY|SELL|WAIT)\s*-?\s*(?:SIGNAL|NOW|TRADE)',
            r'PRIMARY.*?SIGNAL.*?[:=]\s*(BUY|SELL|WAIT)',
        ]
        
        for pattern in signal_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                trade_plan['primary_signal'] = match.group(1).upper()
                break
        
        # Look for entry zones
        entry_patterns = [
            r'ENTRY.*?(?:ZONE|PRICE|LEVEL).*?[\$]?([0-9.]+).*?[\$]?([0-9.]+)',
            r'(?:BUY|SELL).*?(?:AT|BETWEEN|FROM).*?[\$]?([0-9.]+).*?(?:TO|-|AND).*?[\$]?([0-9.]+)',
        ]
        
        for pattern in entry_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                try:
                    low = float(match.group(1))
                    high = float(match.group(2))
                    trade_plan['entry_zone'] = [min(low, high), max(low, high)]
                    break
                except ValueError:
                    continue
        
        # Extract confidence if mentioned
        confidence_patterns = [
            r'CONFIDENCE.*?([0-9]+)%?',
            r'([0-9]+)%?\s*CONFIDENCE',
        ]
        
        for pattern in confidence_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                try:
                    trade_plan['confidence'] = float(match.group(1))
                    break
                except ValueError:
                    continue
        
        return trade_plan if 'primary_signal' in trade_plan else None
    
    def _generate_fallback_trade_plan(self, multi_tf_analysis: Dict, current_price: float,
                                    atr: float, support: float, resistance: float, 
                                    primary_tf: str) -> Dict[str, Any]:
        """Generate a technical fallback trade plan when AI response fails"""
        
        # Analyze consensus across timeframes
        signals = []
        confidences = []
        
        for tf, data in multi_tf_analysis.items():
            if tf == 'btc_influence':
                continue
                
            if 'analysis' in data and 'overall_signal' in data['analysis']:
                signal = data['analysis']['overall_signal']['signal']
                confidence = data['analysis']['overall_signal']['confidence']
                
                signals.append(signal)
                confidences.append(confidence)
        
        if not signals:
            return self._generate_neutral_plan(current_price)
        
        # Determine consensus
        buy_signals = sum(1 for s in signals if 'BUY' in s.upper())
        sell_signals = sum(1 for s in signals if 'SELL' in s.upper())
        avg_confidence = sum(confidences) / len(confidences)
        
        if buy_signals > sell_signals and avg_confidence > 60:
            primary_signal = 'BUY'
        elif sell_signals > buy_signals and avg_confidence > 60:
            primary_signal = 'SELL'
        else:
            primary_signal = 'WAIT'
        
        # Generate entry zone based on current price and ATR
        if primary_signal == 'BUY':
            entry_zone = [
                current_price * 0.995,  # 0.5% below current
                current_price * 1.005   # 0.5% above current
            ]
            stop_loss = current_price - (atr * 2)
            take_profits = self._generate_take_profits(current_price, atr, 'BUY')
        elif primary_signal == 'SELL':
            entry_zone = [
                current_price * 0.995,  # 0.5% below current
                current_price * 1.005   # 0.5% above current
            ]
            stop_loss = current_price + (atr * 2)
            take_profits = self._generate_take_profits(current_price, atr, 'SELL')
        else:
            return self._generate_neutral_plan(current_price)
        
        return {
            'primary_signal': primary_signal,
            'entry_zone': entry_zone,
            'stop_loss': stop_loss,
            'take_profits': take_profits,
            'confidence': min(avg_confidence, 75),  # Cap fallback confidence at 75
            'timeframe': primary_tf,
            'risk_level': 'MEDIUM',
            'generated_method': 'technical_consensus',
            'entry_status': 'TECHNICAL_ANALYSIS',
            'risk_reward_ratio': f"1:{len(take_profits) * 1.5:.1f}",
            'trade_duration': 'MEDIUM',
            'position_sizing': self.plan_config.get('position_sizing', '0.5-2%'),
            'execution_method': 'LIMIT'
        }
    
    def _generate_take_profits(self, current_price: float, atr: float, signal_type: str) -> list:
        """Generate take profit levels based on plan configuration"""
        tp_count = self.plan_config['take_profit_levels']
        take_profits = []
        
        if signal_type == 'BUY':
            for i in range(1, tp_count + 1):
                tp_price = current_price + (atr * 2 * i)
                take_profits.append(tp_price)
        else:  # SELL
            for i in range(1, tp_count + 1):
                tp_price = current_price - (atr * 2 * i)
                take_profits.append(tp_price)
        
        return take_profits
    
    def _generate_neutral_plan(self, current_price: float) -> Dict[str, Any]:
        """Generate neutral/wait plan when no clear signal"""
        return {
            'primary_signal': 'WAIT',
            'entry_zone': [current_price * 0.99, current_price * 1.01],
            'confidence': 30,
            'timeframe': '4h',
            'risk_level': 'LOW',
            'generated_method': 'neutral_fallback',
            'entry_status': 'WAIT_FOR_SIGNAL',
            'message': 'No clear technical signal - waiting for better setup',
            'position_sizing': self.plan_config.get('position_sizing', '0.5-2%'),
        }
    
    def _validate_and_enhance_trade_plan(self, trade_plan: Dict, multi_tf_analysis: Dict,
                                       current_price: float, atr: float, support: float,
                                       resistance: float, primary_tf: str, has_btc: bool) -> Dict:
        """Validate and enhance the trade plan with risk management"""
        
        # Apply plan limits
        if 'take_profits' in trade_plan:
            trade_plan['take_profits'] = trade_plan['take_profits'][:self.plan_config['take_profit_levels']]
        
        # Ensure required fields exist
        if 'entry_zone' not in trade_plan and 'primary_signal' in trade_plan:
            trade_plan['entry_zone'] = [current_price * 0.995, current_price * 1.005]
        
        if 'confidence' not in trade_plan:
            trade_plan['confidence'] = 50
        
        # Add plan metadata
        trade_plan['plan_info'] = {
            'user_plan': self.plan_config.get('user_plan', 'free'),
            'tp_levels_allowed': self.plan_config['take_profit_levels'],
            'tp_levels_provided': len(trade_plan.get('take_profits', [])),
            'btc_analysis_included': has_btc
        }
        
        return trade_plan

class HybridAIProcessor:
    """Alternative approach using two AI calls - one for JSON, one for analysis"""
    
    def __init__(self, plan_config, openrouter_key, ai_model):
        self.plan_config = plan_config
        self.openrouter_key = openrouter_key
        self.ai_model = ai_model
        self.response_handler = AIResponseHandler(plan_config)
    
    def get_hybrid_analysis(self, symbol, multi_tf_analysis, market_context, current_price, 
                          atr, support, resistance, primary_tf, has_btc=False):
        """Get both structured JSON and detailed analysis"""
        
        try:
            # Call 1: Get structured JSON trade plan (always)
            json_plan = self._get_json_trade_plan(symbol, multi_tf_analysis, current_price)
            
            # Validate and enhance the JSON plan
            if json_plan:
                enhanced_plan = self.response_handler._validate_and_enhance_trade_plan(
                    json_plan, multi_tf_analysis, current_price, atr, 
                    support, resistance, primary_tf, has_btc
                )
            else:
                # Fallback to technical analysis if JSON call fails
                enhanced_plan = self.response_handler._generate_fallback_trade_plan(
                    multi_tf_analysis, current_price, atr, support, resistance, primary_tf
                )
            
            # Call 2: Get detailed analysis (only for pro users)
            detailed_analysis = None
            if self.plan_config.get('show_ai_response', False):
                detailed_analysis = self._get_detailed_analysis(
                    symbol, multi_tf_analysis, enhanced_plan, market_context, current_price
                )
            
            return {
                'success': True,
                'trade_plan': enhanced_plan,
                'detailed_analysis': detailed_analysis,
                'hybrid_approach': True,
                'method': 'hybrid_dual_call'
            }
            
        except Exception as e:
            # Ultimate fallback
            return {
                'success': False,
                'error': f"Hybrid analysis failed: {str(e)}",
                'trade_plan': self.response_handler._generate_fallback_trade_plan(
                    multi_tf_analysis, current_price, atr, support, resistance, primary_tf
                ),
                'detailed_analysis': None,
                'method': 'error_fallback'
            }
    
    def _get_json_trade_plan(self, symbol, multi_tf_analysis, current_price):
        """Get structured JSON trade plan"""
        prompt = self._create_json_focused_prompt(symbol, multi_tf_analysis, current_price)
        
        try:
            response = self._call_ai_with_json_mode(prompt)
            return json.loads(response)
        except (json.JSONDecodeError, Exception) as e:
            print(f"JSON mode failed: {e}")
            return None
    
    def _get_detailed_analysis(self, symbol, multi_tf_analysis, trade_plan, market_context, current_price):
        """Get detailed narrative analysis for pro users"""
        prompt = self._create_analysis_focused_prompt(symbol, multi_tf_analysis, trade_plan, market_context, current_price)
        
        try:
            return self._call_ai_standard(prompt)
        except Exception as e:
            return f"Detailed analysis unavailable: {str(e)}"
    
    def _create_json_focused_prompt(self, symbol, multi_tf_analysis, current_price):
        """Create focused prompt for JSON trade plan"""
        from datetime import datetime
        
        # Get primary timeframe data
        primary_tf = '4h' if '4h' in multi_tf_analysis else list(multi_tf_analysis.keys())[0]
        primary_data = multi_tf_analysis.get(primary_tf, {})
        
        # Extract key technical data
        signals = []
        confidences = []
        for tf, data in multi_tf_analysis.items():
            if tf != 'btc_influence' and 'analysis' in data:
                signal = data['analysis'].get('overall_signal', {}).get('signal', 'NEUTRAL')
                confidence = data['analysis'].get('overall_signal', {}).get('confidence', 0)
                signals.append(f"{tf}: {signal} ({confidence:.0f}%)")
                confidences.append(confidence)
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 50
        
        # Get BTC influence if available
        btc_summary = ""
        if 'btc_influence' in multi_tf_analysis:
            btc = multi_tf_analysis['btc_influence']
            btc_summary = f"BTC Influence: {btc.get('influence', 'unknown').upper()}, Risk: {btc.get('risk_level', 'medium').upper()}"
        
        prompt = f"""Generate a trading decision for {symbol} as JSON only.

CURRENT PRICE: ${current_price:.6f}
TIMEFRAME SIGNALS: {' | '.join(signals)}
{btc_summary}

PLAN: {self.plan_config.get('user_plan', 'free').upper()}
TAKE PROFIT LEVELS: {self.plan_config['take_profit_levels']}

Return ONLY valid JSON with these exact fields:
{{
    "primary_signal": "BUY/SELL/WAIT",
    "confidence": {avg_confidence:.0f},
    "entry_zone": [entry_low, entry_high],
    "stop_loss": stop_price,
    "take_profits": [tp1{', tp2' if self.plan_config['take_profit_levels'] > 1 else ''}{', tp3' if self.plan_config['take_profit_levels'] > 2 else ''}],
    "risk_reward_ratio": "1:X.X",
    "timeframe": "{primary_tf}",
    "risk_level": "LOW/MEDIUM/HIGH",
    "entry_status": "ENTER_NOW/WAIT_FOR_PULLBACK/ENTRY_MISSED",
    "trade_duration": "SHORT/MEDIUM/LONG",
    "execution_method": "MARKET/LIMIT"
}}

RULES:
- Entry zone within ±2% of current price
- Stop loss max 3% from entry
- Min risk:reward 1:2
- BUY: stops below entry, TPs above
- SELL: stops above entry, TPs below"""
        
        return prompt
    
    def _create_analysis_focused_prompt(self, symbol, multi_tf_analysis, trade_plan, market_context, current_price):
        """Create detailed analysis prompt for pro users"""
        from datetime import datetime
        
        prompt = f"""🚀 PRO ANALYSIS for {symbol} (Detailed Report)

TIMESTAMP: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
CURRENT PRICE: ${current_price:.6f}

CONFIRMED TRADE PLAN:
• Signal: {trade_plan.get('primary_signal', 'Unknown')}
• Entry Zone: ${trade_plan.get('entry_zone', [0, 0])[0]:.6f} - ${trade_plan.get('entry_zone', [0, 0])[1]:.6f}
• Stop Loss: ${trade_plan.get('stop_loss', 0):.6f}
• Take Profits: {[f"${tp:.6f}" for tp in trade_plan.get('take_profits', [])]}
• Confidence: {trade_plan.get('confidence', 0)}%

Provide comprehensive analysis covering:

🎯 ENTRY ANALYSIS & TIMING
• Current price vs entry zone validation
• Optimal entry method and timing
• Market conditions for execution

📊 MULTI-TIMEFRAME CONVERGENCE
• How different timeframes align
• Key support/resistance levels
• Trend strength across timeframes

⚡ MOMENTUM & STRATEGY INSIGHTS  
• Which strategies are firing
• Momentum quality and sustainability
• Volume and volatility considerations

🚨 RISK FACTORS & MANAGEMENT
• Key invalidation levels
• Position sizing recommendations
• Market risks and mitigation

💰 PROFIT TAKING STRATEGY
• TP level justification
• Scaling out recommendations
• Hold vs take profit decisions

🔶 BTC & MARKET CORRELATION
• How BTC affects this trade
• Broader market influences
• Correlation-based adjustments

📈 EXECUTION PLAN
• Step-by-step trade execution
• What to watch after entry
• Exit strategy refinements

🧠 MARKET PSYCHOLOGY
• Crowd positioning analysis
• Contrarian vs momentum play
• Emotional discipline required

Provide detailed, actionable insights with specific price levels and timing guidance."""
        
        return prompt
    
    def _call_ai_with_json_mode(self, prompt):
        """Call AI with JSON mode forced"""
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "HTTP-Referer": "http://localhost",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.ai_model,
            "messages": [
                {
                    "role": "system", 
                    "content": f"You are a crypto trading expert. Return ONLY valid JSON. User plan: {self.plan_config.get('user_plan', 'free').upper()}. Take profits allowed: {self.plan_config['take_profit_levels']}."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 2000
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers, json=data, timeout=30
        )
        
        result = response.json()
        if "choices" not in result:
            raise Exception(f"API Error: {result}")
        
        return result["choices"][0]["message"]["content"]
    
    def _call_ai_standard(self, prompt):
        """Call AI for detailed analysis without JSON constraint"""
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "HTTP-Referer": "http://localhost", 
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.ai_model,
            "messages": [
                {
                    "role": "system",
                    "content": f"You are an elite crypto trading analyst providing detailed market analysis. User plan: {self.plan_config.get('user_plan', 'free').upper()}."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 8000
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers, json=data, timeout=45
        )
        
        result = response.json()
        if "choices" not in result:
            raise Exception(f"API Error: {result}")
        
        return result["choices"][0]["message"]["content"]