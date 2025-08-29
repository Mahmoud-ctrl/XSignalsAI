import re
from celery_app import celery
from AIAnalysis import ComprehensiveAnalyzer, PLAN_LIMITS
from models import db, AISignals
import json
from datetime import datetime
import pytz
from celery import chain

lebanon_tz = pytz.timezone("Asia/Beirut")

def validate_trading_json(json_obj):
    if not isinstance(json_obj, dict): return False
    if 'entry_status' not in json_obj or 'primary_signal' not in json_obj: return False
    if json_obj.get('primary_signal') not in ['BUY', 'SELL', 'WAIT']: return False
    if json_obj.get('entry_status') not in ['OPTIMAL', 'ENTER_NOW', 'WAIT_FOR_PULLBACK', 'ENTRY_MISSED', 'ENTRY_DEAD', 'STILL_VIABLE']: return False
    return True

def parse_ai_response_json(ai_response):
    if not ai_response: return None, ai_response
    try:
        return json.loads(ai_response), ""
    except json.JSONDecodeError: pass
    json_patterns = [r'```json\s*(\{[\s\S]*?\})\s*```', r'```\s*(\{[\s\S]*?\})\s*```', r'\{[\s\S]*\}']
    for pattern in json_patterns:
        matches = re.findall(pattern, ai_response, re.MULTILINE | re.DOTALL)
        for match in matches:
            try:
                test_json = json.loads(match)
                if validate_trading_json(test_json):
                    clean_text = re.sub(pattern, '', ai_response, flags=re.MULTILINE | re.DOTALL).strip()
                    return test_json, clean_text
            except json.JSONDecodeError: continue
    return None, ai_response

def validate_ai_signal_data(data, expected_tp_levels=1):
    required_fields = ['entry_status', 'primary_signal', 'entry_zone', 'stop_loss']
    if not isinstance(data, dict): return False
    for field in required_fields:
        if field not in data: return False
    entry_zone = data.get('entry_zone')
    if not isinstance(entry_zone, list) or not entry_zone: return False
    if data.get('primary_signal') not in ['BUY', 'SELL', 'WAIT']: return False
    if data.get('entry_status') not in ['OPTIMAL', 'ENTER_NOW', 'WAIT_FOR_PULLBACK', 'ENTRY_MISSED', 'ENTRY_DEAD']: return False
    return True

@celery.task(name='tasks.fetch_and_analyze_data')
def fetch_and_analyze_data(symbol, timeframes, ai_model, include_btc, current_user, user_plan):
    """
    Task 1: Fetches market context and performs multi-timeframe analysis.
    This separates the data gathering part of the process.
    """
    print(f"Task 1: Fetching data for {symbol}...")
    analyzer = ComprehensiveAnalyzer(
        user_plan=user_plan,
        ai_model=ai_model,
        user_id=current_user
    )
    
    market_context = analyzer.get_market_context(symbol)
    multi_tf_analysis = analyzer.analyze_multiple_timeframes(
        symbol, timeframes, include_btc=include_btc
    )

    if not multi_tf_analysis:
        # We can stop the chain here if data fetching fails
        # In a more complex setup, you might have custom error handling tasks.
        return {'error': 'No analysis data available', 'status': 'FAILURE'}

    # Pass all necessary data to the next task in the chain
    return {
        'market_context': market_context,
        'multi_tf_analysis': multi_tf_analysis,
        'symbol': symbol,
        'timeframes': timeframes,
        'ai_model': ai_model,
        'include_btc': include_btc,
        'current_user': current_user,
        'user_plan': user_plan
    }

@celery.task(name='tasks.run_ai_and_save_results')
def run_ai_and_save_results(previous_task_result):
    """
    Task 2: Takes the fetched data, queries the AI, processes the result,
    and saves it to the database.
    """
    if previous_task_result.get('status') == 'FAILURE':
        return previous_task_result

    # Unpack data from the previous task
    market_context = previous_task_result['market_context']
    multi_tf_analysis = previous_task_result['multi_tf_analysis']
    symbol = previous_task_result['symbol']
    timeframes = previous_task_result['timeframes']
    ai_model = previous_task_result['ai_model']
    include_btc = previous_task_result['include_btc']
    current_user = previous_task_result['current_user']
    user_plan = previous_task_result['user_plan']

    print(f"Task 2: Running AI analysis for {symbol}...")
    analyzer = ComprehensiveAnalyzer(
        user_plan=user_plan,
        ai_model=ai_model,
        user_id=current_user
    )

    plan_features = analyzer.get_plan_features()

    raw_ai_analysis = analyzer.query_ai_analysis(
        symbol, multi_tf_analysis, market_context, use_btc_analysis=include_btc
    )
    
    ai_signal_data, clean_ai_text = parse_ai_response_json(raw_ai_analysis)

    if ai_signal_data and 'take_profits' in ai_signal_data:
        ai_signal_data['take_profits'] = analyzer.filter_take_profits_by_plan(
            ai_signal_data['take_profits']
        )

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

    signal_id = None
    if ai_signal_data and validate_ai_signal_data(ai_signal_data, PLAN_LIMITS[user_plan]['take_profit_levels']):
        try:
            best_timeframe = ai_signal_data.get('timeframe', timeframes[0] if timeframes else '1h')
            new_signal = AISignals(
                symbol=symbol, user_id=current_user, timeframe=best_timeframe,
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
        except Exception as db_error:
            print(f"DB Error: {db_error}")
            db.session.rollback()

    btc_influence_data = multi_tf_analysis.pop('btc_influence', None)

    response = {
        'symbol': symbol,
        'timestamp': datetime.now(lebanon_tz).isoformat(),
        'user_plan_info': plan_features,
        'market_context': market_context,
        'multi_timeframe_analysis': multi_tf_analysis,
        'btc_influence': btc_influence_data,
        'ai_analysis': clean_ai_text if plan_features['show_ai_response'] else "AI response hidden for your plan",
        'ai_signal': ai_signal_data,
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
    
    return response
