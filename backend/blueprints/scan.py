from flask import Blueprint, jsonify, request
import logging
from datetime import datetime
import pytz
from CryptoOpportunityScanner import CryptoOpportunityScanner
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User

scan_bp = Blueprint('scan', __name__)

# Initialize scanner
scanner = CryptoOpportunityScanner()

# Popular crypto pairs organized by category
CRYPTO_PAIRS = {
    'major': [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
        'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT'
    ],
    'defi': [
        'AAVEUSDT', 'UNIUSDT', 'LINKUSDT', 'MKRUSDT', 'COMPUSDT',
        'YFIUSDT', 'SNXUSDT', 'CRVUSDT', 'BALUSDT', 'RENUSDT'
    ],
    'altcoins': [
        'LTCUSDT', 'ETCUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT',
        'TRXUSDT', 'EOSUSDT', 'KNCUSDT', 'ZRXUSDT', 'ATOMUSDT'
    ]
}

# Flatten all pairs for quick access
ALL_PAIRS = [pair for category in CRYPTO_PAIRS.values() for pair in category]

# Plan configurations
PLAN_LIMITS = {
    'free': {
        'max_pairs': 1,
        'max_scans_per_hour': 5,
        'features': ['basic_signals', '5m_1h_timeframes']
    },
    'premium': {
        'max_pairs': 5,
        'max_scans_per_hour': 20,
        'features': ['advanced_signals', 'all_timeframes', 'risk_analysis']
    },
    'pro': {
        'max_pairs': 20,
        'max_scans_per_hour': 100,
        'features': ['premium_signals', 'all_features', 'priority_support']
    }
}

lebanon_tz = pytz.timezone("Asia/Beirut")

def get_user_plan(user_id=None):
    if not user_id:
        return 'free'  # default if no user_id provided
    
    user = User.query.filter_by(id=user_id).first()
    if user and user.tier:
        return user.tier
    
    return 'free'  # fallback default

def validate_scan_request(pairs, user_plan):
    """Validate scan request based on user plan"""
    plan_config = PLAN_LIMITS.get(user_plan, PLAN_LIMITS['free'])
    
    # Check pair limit
    if len(pairs) > plan_config['max_pairs']:
        return False, f"Your {user_plan} plan allows up to {plan_config['max_pairs']} pairs per scan"
    
    # Validate pair names
    invalid_pairs = [pair for pair in pairs if pair.upper() not in ALL_PAIRS]
    if invalid_pairs:
        return False, f"Invalid pairs: {', '.join(invalid_pairs)}"
    
    return True, None

@scan_bp.route('/scan', methods=['POST'])
@jwt_required()
def scan_opportunities():
    """Scan for crypto opportunities with plan-based limits"""
    try:
        current_user = get_jwt_identity()
        print('Current user:', current_user)
        user_plan = get_user_plan(current_user)
        
        data = request.get_json()
        
        # Extract parameters
        pairs = data.get('pairs', ['BTCUSDT'])
        timeframe = data.get('timeframe', '1h')
        min_opportunity_score = data.get('min_opportunity_score', 0.5)
        
        # Validate pairs and plan limits
        is_valid, error_message = validate_scan_request(pairs, user_plan)
        if not is_valid:
            return jsonify({
                'error': error_message,
                'user_plan': user_plan,
                'plan_limits': PLAN_LIMITS[user_plan]
            }), 400
        
        # Validate timeframe
        if timeframe not in scanner.timeframe_map:
            return jsonify({
                'error': f'Invalid timeframe. Supported: {list(scanner.timeframe_map.keys())}'
            }), 400
        
        # Convert to uppercase for consistency
        pairs = [pair.upper() for pair in pairs]
        
        # Scan for opportunities + logs
        opportunities, scan_logs = scanner.scan_multiple_pairs(pairs, timeframe, min_opportunity_score)
        
        # Add actionable flag based on plan features
        plan_config = PLAN_LIMITS[user_plan]
        for opp in opportunities:
            if 'advanced_signals' in plan_config['features']:
                opp['actionable'] = opp.get('confidence', 0) >= 60
            else:
                opp['actionable'] = opp.get('confidence', 0) >= 70
        
        return jsonify({
            'scan_summary': {
                'pairs_scanned': len(pairs),
                'timeframe': timeframe,
                'opportunities_found': len(opportunities),
                'actionable_opportunities': len([o for o in opportunities if o.get('actionable', False)]),
                'min_opportunity_score': min_opportunity_score,
                'scan_time': datetime.now(lebanon_tz).isoformat(),
                'user_plan': user_plan
            },
            'opportunities': opportunities,
            'scan_logs': scan_logs,  # ✅ new
            'plan_info': {
                'current_plan': user_plan,
                'pairs_used': f"{len(pairs)}/{plan_config['max_pairs']}",
                'features': plan_config['features']
            }
        })
        
    except Exception as e:
        logging.error(f"Scan error: {e}")
        return jsonify({'error': str(e)}), 500

@scan_bp.route('/analyze/<symbol>', methods=['GET'])
@jwt_required()
def analyze_single_pair(symbol):
    """Analyze a single crypto pair"""
    try:
        current_user = get_jwt_identity()
        user_plan = get_user_plan(current_user)
        
        timeframe = request.args.get('timeframe', '1h')
        
        if timeframe not in scanner.timeframe_map:
            return jsonify({
                'error': f'Invalid timeframe. Supported: {list(scanner.timeframe_map.keys())}'
            }), 400
        
        # Check if pair is valid
        symbol_upper = symbol.upper()
        if symbol_upper not in ALL_PAIRS:
            return jsonify({'error': f'Invalid trading pair: {symbol}'}), 400
        
        result = scanner.analyze_crypto_pair(symbol_upper, timeframe)
        
        # Add plan-specific enhancements
        plan_config = PLAN_LIMITS[user_plan]
        result['plan_info'] = {
            'current_plan': user_plan,
            'features_available': plan_config['features']
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scan_bp.route('/quick-scan', methods=['GET'])
@jwt_required()
def quick_scan():
    """Quick scan of major pairs with plan limits"""
    try:
        current_user = get_jwt_identity()
        user_plan = get_user_plan(current_user)
        plan_config = PLAN_LIMITS[user_plan]
        
        timeframe = request.args.get('timeframe', '1h')
        min_score = float(request.args.get('min_score', 1.0))

        # Limit pairs based on plan
        pairs_to_scan = CRYPTO_PAIRS['major'][:plan_config['max_pairs']]
        
        opportunities = scanner.scan_multiple_pairs(pairs_to_scan, timeframe, min_score)
        print(f"Quick scan found {len(opportunities)} opportunities for {user_plan} user")
        
        # Filter to actionable signals based on plan
        actionable = []
        for opp in opportunities:
            if 'advanced_signals' in plan_config['features']:
                if opp.get('actionable', False) or opp.get('confidence', 0) >= 60:
                    opp['actionable'] = True
                    actionable.append(opp)
            else:
                if opp.get('actionable', False) or opp.get('confidence', 0) >= 70:
                    opp['actionable'] = True
                    actionable.append(opp)
        
        print(f"Quick scan found {len(actionable)} actionable opportunities")
        
        return jsonify({
            'actionable_opportunities': actionable,
            'count': len(actionable),
            'timeframe': timeframe,
            'plan_info': {
                'current_plan': user_plan,
                'pairs_scanned': len(pairs_to_scan),
                'max_pairs': plan_config['max_pairs'],
                'upgrade_available': user_plan != 'pro'
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scan_bp.route('/pairs', methods=['GET'])
def get_available_pairs():
    """Get all available trading pairs organized by category"""
    return jsonify({
        'pairs': CRYPTO_PAIRS,
        'total_pairs': len(ALL_PAIRS),
        'categories': list(CRYPTO_PAIRS.keys())
    })

@scan_bp.route('/plans', methods=['GET'])
def get_plan_info():
    """Get plan information and limits"""
    return jsonify({
        'plans': PLAN_LIMITS,
        'features_explanation': {
            'basic_signals': 'Standard buy/sell signals',
            'advanced_signals': 'Enhanced signals with confidence scores',
            'premium_signals': 'AI-powered signals with market sentiment',
            '5m_1h_timeframes': 'Timeframes: 5m, 15m, 1h',
            'all_timeframes': 'All timeframes including 4h, 1d, 1w',
            'risk_analysis': 'Detailed risk assessment',
            'all_features': 'Access to all platform features',
            'priority_support': '24/7 priority customer support'
        }
    })

@scan_bp.route('/user/plan', methods=['GET'])
@jwt_required()
def get_user_plan_info():
    """Get current user's plan information"""
    try:
        current_user = get_jwt_identity()
        user_plan = get_user_plan(current_user)
        plan_config = PLAN_LIMITS[user_plan]
        
        return jsonify({
            'current_plan': user_plan,
            'limits': plan_config,
            'upgrade_options': {
                plan: config for plan, config in PLAN_LIMITS.items() 
                if plan != user_plan and PLAN_LIMITS[plan]['max_pairs'] > plan_config['max_pairs']
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scan_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'crypto-opportunity-scanner',
        'binance_api': 'connected',
        'supported_pairs': len(ALL_PAIRS),
        'available_plans': list(PLAN_LIMITS.keys())
    })