from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, AISignals, User  # Assuming you have a User model with plan info
from AIAnalysis import ComprehensiveAnalyzer, PLAN_LIMITS
from indicators import compute_indicators
import json
import re
import traceback
from datetime import datetime, timedelta
import pytz

comprehensive_analysis_bp = Blueprint('comprehensive_analysis', __name__)

lebanon_tz = pytz.timezone("Asia/Beirut")

def get_user_plan_info(user_id=None):
    if not user_id:
        return 'free'  # default if no user_id provided
    
    user = User.query.filter_by(id=user_id).first()
    if user and user.tier:
        return user.tier
    
    return 'free'  # fallback default

def max_scans_per_day(user_id):
    user_plan = get_user_plan_info(user_id)
    return PLAN_LIMITS[user_plan]['max_scans_per_day']


def can_user_run_analysis(user_id):
    max_per_day = max_scans_per_day(user_id) 

    one_day_ago = datetime.now(lebanon_tz) - timedelta(days=1)

    # Count user’s scans in the last 24 hours
    count_last_day = AISignals.query.filter(
        AISignals.user_id == user_id,
        AISignals.created_at >= one_day_ago
    ).count()

    return count_last_day < max_per_day

def validate_ai_signal_data(data, expected_tp_levels=1):
    """Validate that the AI signal data contains required fields"""
    required_fields = ['entry_status', 'primary_signal', 'entry_zone', 'stop_loss']
    
    if not isinstance(data, dict):
        return False
    
    for field in required_fields:
        if field not in data:
            print(f"Missing required field: {field}")
            return False
    
    # Validate entry_zone is a list with at least one element
    entry_zone = data.get('entry_zone')
    if not isinstance(entry_zone, list) or len(entry_zone) == 0:
        print("Invalid entry_zone format")
        return False
    
    # Validate primary_signal is valid
    valid_signals = ['BUY', 'SELL', 'WAIT']
    if data.get('primary_signal') not in valid_signals:
        print(f"Invalid primary_signal: {data.get('primary_signal')}")
        return False
    
    # Validate entry_status is valid
    valid_statuses = ['OPTIMAL', 'ENTER_NOW', 'WAIT_FOR_PULLBACK', 'ENTRY_MISSED', 'ENTRY_DEAD']
    if data.get('entry_status') not in valid_statuses:
        print(f"Invalid entry_status: {data.get('entry_status')}")
        return False
    
    # Validate take_profits count matches expected
    take_profits = data.get('take_profits', [])
    if len(take_profits) != expected_tp_levels:
        print(f"Take profits count mismatch. Expected: {expected_tp_levels}, Got: {len(take_profits)}")
        # Don't fail validation, just log - AI might provide different count
    
    return True
def parse_ai_response_json(ai_response):
    """
    Enhanced JSON extraction with multiple fallback methods
    Returns: (json_data, clean_text_response)
    """
    if not ai_response:
        return None, ai_response

    json_data = None
    clean_text = ai_response

    try:
        # Method 1: Try direct JSON parse (if response is pure JSON)
        json_data = json.loads(ai_response)
        clean_text = ""  # If pure JSON, no text content
        return json_data, clean_text
    except json.JSONDecodeError:
        pass

    # Method 2: Look for JSON blocks in markdown format
    json_patterns = [
        r'```json\s*(\{[\s\S]*?\})\s*```',  # ```json block
        r'```\s*(\{[\s\S]*?\})\s*```',      # ``` block with JSON
        r'\{[\s\S]*\}'                       # Any JSON-like structure
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, ai_response, re.MULTILINE | re.DOTALL)
        for match in matches:
            try:
                # Try to parse each match
                test_json = json.loads(match)
                # Validate it has required trading fields
                if validate_trading_json(test_json):
                    json_data = test_json
                    # Remove the JSON from text for clean display
                    clean_text = re.sub(pattern, '', ai_response, flags=re.MULTILINE | re.DOTALL).strip()
                    return json_data, clean_text
            except json.JSONDecodeError:
                continue

    # Method 3: Look for specific trading JSON structure
    try:
        # Look for entry_status, primary_signal patterns
        json_start = ai_response.find('{')
        json_end = ai_response.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            potential_json = ai_response[json_start:json_end]
            test_json = json.loads(potential_json)
            
            if validate_trading_json(test_json):
                json_data = test_json
                # Clean text by removing the JSON part
                clean_text = (ai_response[:json_start] + ai_response[json_end:]).strip()
                return json_data, clean_text
                
    except (json.JSONDecodeError, ValueError):
        pass

    # Method 4: Last resort - extract key-value pairs manually
    json_data = extract_trading_data_manual(ai_response)
    if json_data:
        return json_data, clean_text

    return None, clean_text

def validate_trading_json(json_obj):
    """
    Validate that JSON contains required trading fields
    """
    required_fields = ['entry_status', 'primary_signal']
    optional_fields = ['entry_zone', 'stop_loss', 'take_profits', 'confidence']
    
    if not isinstance(json_obj, dict):
        return False
    
    # Must have at least the required fields
    for field in required_fields:
        if field not in json_obj:
            return False
    
    # Validate signal values
    valid_signals = ['BUY', 'SELL', 'WAIT']
    if json_obj.get('primary_signal') not in valid_signals:
        return False
        
    valid_statuses = ['OPTIMAL', 'ENTER_NOW', 'WAIT_FOR_PULLBACK', 'ENTRY_MISSED', 'ENTRY_DEAD', 'STILL_VIABLE']
    if json_obj.get('entry_status') not in valid_statuses:
        return False
    
    return True

def extract_trading_data_manual(text):
    """
    Manual extraction as last resort when JSON parsing fails
    """
    try:
        data = {}
        
        # Extract primary signal
        signal_patterns = [
            r'"primary_signal":\s*"([^"]+)"',
            r'primary_signal["\']?\s*:\s*["\']([^"\']+)["\']',
            r'Signal:\s*(BUY|SELL|WAIT)'
        ]
        
        for pattern in signal_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                signal = match.group(1).upper()
                if signal in ['BUY', 'SELL', 'WAIT']:
                    data['primary_signal'] = signal
                    break
        
        # Extract entry status
        status_patterns = [
            r'"entry_status":\s*"([^"]+)"',
            r'entry_status["\']?\s*:\s*["\']([^"\']+)["\']',
            r'Entry Status:\s*(OPTIMAL|ENTER_NOW|WAIT_FOR_PULLBACK|ENTRY_MISSED)'
        ]
        
        for pattern in status_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                status = match.group(1).upper()
                valid_statuses = ['OPTIMAL', 'ENTER_NOW', 'WAIT_FOR_PULLBACK', 'ENTRY_MISSED', 'ENTRY_DEAD']
                if status in valid_statuses:
                    data['entry_status'] = status
                    break
        
        # Extract entry zone (look for price ranges)
        entry_patterns = [
            r'"entry_zone":\s*\[([^\]]+)\]',
            r'Entry.*?(\d+\.?\d*)\s*-\s*(\d+\.?\d*)',
            r'\$(\d+\.?\d*)\s*-\s*\$(\d+\.?\d*)'
        ]
        
        for pattern in entry_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    if 'entry_zone' in pattern:
                        # Parse array format
                        prices = [float(x.strip().replace('"', '').replace('$', '')) 
                                for x in match.group(1).split(',')]
                        data['entry_zone'] = prices[:2]
                    else:
                        # Parse range format
                        low = float(match.group(1).replace('$', ''))
                        high = float(match.group(2).replace('$', ''))
                        data['entry_zone'] = [low, high]
                    break
                except (ValueError, IndexError):
                    continue
        
        # Extract stop loss
        sl_patterns = [
            r'"stop_loss":\s*([0-9.]+)',
            r'Stop Loss.*?\$?([0-9.]+)',
            r'SL.*?\$?([0-9.]+)'
        ]
        
        for pattern in sl_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    data['stop_loss'] = float(match.group(1))
                    break
                except ValueError:
                    continue
        
        # Extract confidence
        conf_patterns = [
            r'"confidence":\s*([0-9]+)',
            r'Confidence.*?([0-9]+)',
            r'confidence.*?([0-9]+)'
        ]
        
        for pattern in conf_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data['confidence'] = int(match.group(1))
                    break
                except ValueError:
                    continue
        
        # Only return if we have minimum required data
        if 'primary_signal' in data and 'entry_status' in data:
            return data
            
    except Exception as e:
        print(f"Manual extraction error: {e}")
    
    return None

# Updated comprehensive_analysis route
@comprehensive_analysis_bp.route('/comprehensive-analysis', methods=['POST'])
@jwt_required()
def comprehensive_analysis():
    """Enhanced comprehensive AI analysis endpoint with improved JSON extraction"""
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        timeframes = data.get('timeframes', ['15m', '1h', '4h', '1d'])
        ai_model = data.get('ai_model', None)
        include_btc = data.get('include_btc', False)

        current_user = int(get_jwt_identity())
        if not current_user:
            return jsonify({'error': 'Unauthorized access'}), 401

        if not can_user_run_analysis(current_user):
            return {"error": "Daily analysis limit reached. Upgrade your plan to unlock more."}, 403
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        user_plan = get_user_plan_info(current_user)
        
        print(f"Starting comprehensive analysis for {symbol} (User: {current_user}, Plan: {user_plan})...")

        analyzer = ComprehensiveAnalyzer(
            user_plan=user_plan,
            ai_model=ai_model,
            user_id=current_user
        )

        plan_features = analyzer.get_plan_features()

        if ai_model and ai_model not in analyzer.get_available_ai_models():
            return jsonify({
                'error': f'AI model "{ai_model}" not available for {user_plan} plan',
                'available_models': analyzer.get_available_ai_models()
            }), 400

        market_context = analyzer.get_market_context(symbol)
        multi_tf_analysis = analyzer.analyze_multiple_timeframes(
            symbol, timeframes, include_btc=include_btc
        )

        if not multi_tf_analysis:
            return jsonify({'error': 'No analysis data available'}), 500

        # AI analysis
        raw_ai_analysis = analyzer.query_ai_analysis(
            symbol, multi_tf_analysis, market_context, use_btc_analysis=include_btc
        )
        
        print(f"Raw AI Analysis Response: {raw_ai_analysis}")
        
        # FIXED: Handle the response correctly
        ai_signal_data = None
        clean_ai_text = ""
        
        try:
            # First try to parse as direct JSON (which it should be)
            ai_response_json = json.loads(raw_ai_analysis)
            print(f"Successfully parsed AI response JSON: {list(ai_response_json.keys())}")
            
            # Extract trade plan (this should be your structured data)
            if 'trade_plan' in ai_response_json and ai_response_json.get('success', False):
                ai_signal_data = ai_response_json['trade_plan']
                
                # For clean text, use detailed_analysis if available (for pro users)
                if 'detailed_analysis' in ai_response_json:
                    clean_ai_text = ai_response_json['detailed_analysis']
                else:
                    clean_ai_text = f"Analysis completed using {ai_response_json.get('method', 'hybrid')} method"
                    
            else:
                # If no trade_plan or not successful, treat as error
                clean_ai_text = raw_ai_analysis
                
        except json.JSONDecodeError:
            # Fallback to original parsing method if it's not pure JSON
            print("Not pure JSON, trying original parsing method...")
            ai_signal_data, clean_ai_text = parse_ai_response_json(raw_ai_analysis)
        
        print(f"AI Response Processing Results:")
        print(f"- JSON extracted: {'✅' if ai_signal_data else '❌'}")
        print(f"- JSON keys: {list(ai_signal_data.keys()) if ai_signal_data else 'None'}")
        print(f"- Clean text length: {len(clean_ai_text) if clean_ai_text else 0}")

        # Validate and filter take profits based on plan
        if ai_signal_data and 'take_profits' in ai_signal_data:
            expected_tp_levels = PLAN_LIMITS[user_plan]['take_profit_levels']
            ai_signal_data['take_profits'] = analyzer.filter_take_profits_by_plan(
                ai_signal_data['take_profits']
            )

        # Enhanced upgrade logic
        ai_signal_upgraded = False
        if ai_signal_data:
            try:
                conf_val = ai_signal_data.get('confidence', 5)
                if isinstance(conf_val, str) and conf_val.isdigit():
                    conf_val = int(conf_val)
                elif isinstance(conf_val, float):
                    conf_val = round(conf_val)

                current_price = analyzer.get_current_price(symbol)
                entry_zone = ai_signal_data.get('entry_zone', [])
                if len(entry_zone) == 2 and current_price:
                    low, high = entry_zone
                    price_near_entry = low * 0.995 <= current_price <= high * 1.005
                else:
                    price_near_entry = False

                confidence_threshold = 7 if user_plan == 'free' else 6
                if (ai_signal_data.get('entry_status') == 'WAIT_FOR_PULLBACK' and 
                    conf_val >= confidence_threshold and price_near_entry):
                    ai_signal_data['entry_status'] = 'ENTER_NOW'
                    ai_signal_upgraded = True
            except Exception as e:
                print(f"Error in upgrade logic: {e}")

        # Save to database if valid
        signal_id = None
        if ai_signal_data and validate_ai_signal_data(ai_signal_data, PLAN_LIMITS[user_plan]['take_profit_levels']):
            try:
                best_timeframe = ai_signal_data.get('timeframe', timeframes[0] if timeframes else '1h')

                new_signal = AISignals(
                    symbol=symbol,
                    user_id=current_user,
                    timeframe=best_timeframe,
                    primary_signal=ai_signal_data.get('primary_signal', 'WAIT'),
                    confidence=ai_signal_data.get('confidence', 5),
                    entry_zone_low=ai_signal_data.get('entry_zone', [0, 0])[0],
                    entry_zone_high=ai_signal_data.get('entry_zone', [0, 0])[1] if len(ai_signal_data.get('entry_zone', [0])) > 1 else ai_signal_data.get('entry_zone', [0])[0],
                    stop_loss=ai_signal_data.get('stop_loss', 0),
                    take_profits=ai_signal_data.get('take_profits', []),
                    entry_status=ai_signal_data.get('entry_status', 'WAIT_FOR_PULLBACK'),
                    result='ACTIVE' if ai_signal_data.get('entry_status') in ['OPTIMAL', 'ENTER_NOW'] else None
                )

                db.session.add(new_signal)
                db.session.commit()
                signal_id = new_signal.id

                print(f"✅ Saved AI signal to DB with ID: {signal_id}")

            except Exception as db_error:
                print(f"DB save error: {db_error}")
                db.session.rollback()

        btc_influence_data = multi_tf_analysis.pop('btc_influence', None)

        # Prepare response
        response = {
            'symbol': symbol,
            'timestamp': datetime.now(lebanon_tz).isoformat(),
            'user_plan_info': plan_features,
            'market_context': market_context,
            'multi_timeframe_analysis': multi_tf_analysis,
            'btc_influence': btc_influence_data,
            'ai_analysis': clean_ai_text if plan_features['show_ai_response'] else "AI response hidden for your plan",
            'ai_signal': ai_signal_data,  # Always include the structured JSON
            'ai_signal_upgraded': ai_signal_upgraded,
            'signal_id': signal_id,
            'timeframes_analyzed': list(multi_tf_analysis.keys()),
            'plan_limitations_applied': {
                'timeframes_filtered': len(timeframes) != len(multi_tf_analysis.keys()),
                'original_timeframes': timeframes,
                'allowed_timeframes': list(multi_tf_analysis.keys()),
                'tp_levels_limited': True if ai_signal_data and 'take_profits' in ai_signal_data else False
            }
        }
        
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error in comprehensive analysis: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@comprehensive_analysis_bp.route('/available-ai-models', methods=['GET'])
@jwt_required()
def get_available_ai_models():
    """Get available AI models for current user's plan"""
    try:
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({'error': 'Unauthorized access'}), 401

        user_plan = get_user_plan_info(current_user)
        
        # Create analyzer to get available models
        analyzer = ComprehensiveAnalyzer(user_plan=user_plan, user_id=current_user)
        
        response = {
            'success': True,
            'user_plan': user_plan,
            'available_models': analyzer.get_available_ai_models(),
            'current_default': analyzer.ai_model,
            'plan_features': analyzer.get_plan_features()
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error getting available AI models: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@comprehensive_analysis_bp.route('/plan-info', methods=['GET'])
@jwt_required()
def get_plan_info():
    """Get current user's plan information and limitations"""
    try:
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({'error': 'Unauthorized access'}), 401

        user_plan = get_user_plan_info(current_user)
        
        plan_config = PLAN_LIMITS.get(user_plan, PLAN_LIMITS['free'])
        
        response = {
            'success': True,
            'user_plan': user_plan,
            'plan_limits': {
                'max_pairs': plan_config['max_pairs'],
                'max_scans_per_day': plan_config['max_scans_per_day'],
                'take_profit_levels': plan_config['take_profit_levels'],
                'features': plan_config['features'],
                'show_ai_response': plan_config['show_ai_response']
            },
            'available_ai_models': plan_config['ai_models'],
            'upgrade_benefits': {
                'premium': {
                    'additional_pairs': PLAN_LIMITS['premium']['max_pairs'] - plan_config['max_pairs'],
                    'additional_scans': PLAN_LIMITS['premium']['max_scans_per_day'] - plan_config['max_scans_per_day'],
                    'additional_tp_levels': PLAN_LIMITS['premium']['take_profit_levels'] - plan_config['take_profit_levels'],
                    'additional_ai_models': len(PLAN_LIMITS['premium']['ai_models']) - len(plan_config['ai_models'])
                },
                'pro': {
                    'additional_pairs': PLAN_LIMITS['pro']['max_pairs'] - plan_config['max_pairs'],
                    'additional_scans': PLAN_LIMITS['pro']['max_scans_per_day'] - plan_config['max_scans_per_day'],
                    'additional_tp_levels': PLAN_LIMITS['pro']['take_profit_levels'] - plan_config['take_profit_levels'],
                    'additional_ai_models': len(PLAN_LIMITS['pro']['ai_models']) - len(plan_config['ai_models']),
                    'ai_response_access': PLAN_LIMITS['pro']['show_ai_response']
                }
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error getting plan info: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@comprehensive_analysis_bp.route('/test-comprehensive', methods=['GET'])
def test_comprehensive():
    """Test endpoint for comprehensive analysis with plan simulation"""
    symbol = request.args.get('symbol', 'BTCUSDT')
    plan = request.args.get('plan', 'free')
    ai_model = request.args.get('ai_model', None)
    
    if plan not in PLAN_LIMITS:
        return jsonify({'error': f'Invalid plan: {plan}'}), 400
    
    analyzer = ComprehensiveAnalyzer(user_plan=plan, ai_model=ai_model)
    
    # Quick single timeframe test
    df = analyzer.fetch_historical_data(symbol, '1h', 100)
    if df is not None:
        latest, analysis, full_df = compute_indicators(df)
        if latest is not None:
            return jsonify({
                'symbol': symbol,
                'status': 'success',
                'plan_info': analyzer.get_plan_features(),
                'data_points': len(full_df),
                'current_price': float(latest['close']),
                'signal': analysis['overall_signal']['signal'],
                'confidence': analysis['overall_signal']['confidence']
            })
    
    return jsonify({'error': 'Failed to analyze'}), 500

@comprehensive_analysis_bp.route('/ai-signals', methods=['GET'])
@jwt_required()
def get_ai_signals():
    """Fetch AI signals with filtering options"""
    try:
        # Get query parameters
        symbol = request.args.get('symbol', '').upper()
        timeframe = request.args.get('timeframe', '')
        primary_signal = request.args.get('primary_signal', '').upper()
        entry_status = request.args.get('entry_status', '').upper()
        result = request.args.get('result', '').upper()
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Date range filters
        date_from = request.args.get('date_from')  # YYYY-MM-DD format
        date_to = request.args.get('date_to')      # YYYY-MM-DD format
        
        # Sorting options
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, updated_at, confidence
        sort_order = request.args.get('sort_order', 'desc').lower()  # asc or desc
        
        # Build query
        query = AISignals.query
        
        # Apply filters
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        if timeframe:
            query = query.filter(AISignals.timeframe == timeframe)
        
        if primary_signal:
            query = query.filter(AISignals.primary_signal == primary_signal)
        
        if entry_status:
            query = query.filter(AISignals.entry_status == entry_status)
        
        if result:
            query = query.filter(AISignals.result == result)
        
        # Date range filtering
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(AISignals.created_at >= from_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
                # Add 1 day to include the entire day
                to_date = to_date.replace(hour=23, minute=59, second=59)
                query = query.filter(AISignals.created_at <= to_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        
        # Apply sorting
        valid_sort_fields = ['created_at', 'updated_at', 'confidence', 'symbol', 'primary_signal']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        
        sort_column = getattr(AISignals, sort_by)
        if sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        signals = query.offset(offset).limit(limit).all()
        
        # Convert to JSON-serializable format
        signals_data = []
        for signal in signals:
            signal_dict = {
                'id': signal.id,
                'symbol': signal.symbol,
                'timeframe': signal.timeframe,
                'primary_signal': signal.primary_signal,
                'confidence': signal.confidence,
                'entry_zone': {
                    'low': signal.entry_zone_low,
                    'high': signal.entry_zone_high
                },
                'stop_loss': signal.stop_loss,
                'take_profits': signal.take_profits,
                'entry_status': signal.entry_status,
                'result': signal.result,
                'hit_tp_level': signal.hit_tp_level,
                'closed_at': signal.closed_at.isoformat() if signal.closed_at else None,
                'created_at': signal.created_at.isoformat(),
                'updated_at': signal.updated_at.isoformat()
            }
            signals_data.append(signal_dict)
        
        # Prepare response
        response = {
            'success': True,
            'data': signals_data,
            'pagination': {
                'total_count': total_count,
                'limit': limit,
                'offset': offset,
                'has_next': (offset + limit) < total_count,
                'has_previous': offset > 0
            },
            'filters_applied': {
                'symbol': symbol or None,
                'timeframe': timeframe or None,
                'primary_signal': primary_signal or None,
                'entry_status': entry_status or None,
                'result': result or None,
                'date_from': date_from,
                'date_to': date_to
            },
            'sorting': {
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error fetching AI signals: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500

@comprehensive_analysis_bp.route('/ai-signals/stats', methods=['GET'])
@jwt_required()
def get_ai_signals_stats():
    """Get statistics about AI signals"""
    try:
        # Get query parameters for optional filtering
        symbol = request.args.get('symbol', '').upper()
        days = request.args.get('days', 30, type=int)  # Default to last 30 days
        
        # Calculate date range
        end_date = datetime.now(lebanon_tz)
        start_date = end_date - timedelta(days=days)
        
        # Base query
        query = AISignals.query.filter(AISignals.created_at >= start_date)
        
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        # Get all signals in the date range
        signals = query.all()
        
        if not signals:
            return jsonify({
                'success': True,
                'data': {
                    'total_signals': 0,
                    'period_days': days,
                    'symbol': symbol or 'ALL',
                    'message': 'No signals found for the specified criteria'
                }
            })
        
        # Calculate statistics
        total_signals = len(signals)
        
        # Signal distribution
        signal_distribution = {}
        entry_status_distribution = {}
        result_distribution = {}
        timeframe_distribution = {}
        
        # Performance metrics
        completed_trades = []
        active_trades = []
        
        for signal in signals:
            # Signal distribution
            signal_type = signal.primary_signal
            signal_distribution[signal_type] = signal_distribution.get(signal_type, 0) + 1
            
            # Entry status distribution
            entry_status = signal.entry_status
            entry_status_distribution[entry_status] = entry_status_distribution.get(entry_status, 0) + 1
            
            # Result distribution
            result = signal.result or 'PENDING'
            result_distribution[result] = result_distribution.get(result, 0) + 1
            
            # Timeframe distribution
            timeframe = signal.timeframe
            timeframe_distribution[timeframe] = timeframe_distribution.get(timeframe, 0) + 1
            
            # Categorize trades for performance analysis
            if signal.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'SL_HIT', 'COMPLETED']:
                completed_trades.append(signal)
            elif signal.result == 'ACTIVE':
                active_trades.append(signal)
        
        # Calculate performance metrics
        total_completed = len(completed_trades)
        profitable_trades = len([t for t in completed_trades if t.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']])
        losing_trades = len([t for t in completed_trades if t.result == 'SL_HIT'])
        
        win_rate = (profitable_trades / total_completed * 100) if total_completed > 0 else 0
        
        # Average confidence
        avg_confidence = sum(s.confidence for s in signals if s.confidence) / len([s for s in signals if s.confidence])
        
        stats_data = {
            'total_signals': total_signals,
            'period_days': days,
            'symbol': symbol or 'ALL',
            'date_range': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'signal_distribution': signal_distribution,
            'entry_status_distribution': entry_status_distribution,
            'result_distribution': result_distribution,
            'timeframe_distribution': timeframe_distribution,
            'performance_metrics': {
                'total_completed_trades': total_completed,
                'profitable_trades': profitable_trades,
                'losing_trades': losing_trades,
                'active_trades': len(active_trades),
                'win_rate_percentage': round(win_rate, 2),
                'average_confidence': round(avg_confidence, 2) if avg_confidence else 0
            }
        }
        
        response = {
            'success': True,
            'data': stats_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error fetching AI signals stats: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500