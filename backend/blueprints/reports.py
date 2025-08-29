from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_, or_, desc, asc
from collections import defaultdict
import pytz

from models import db, AISignals, User

lebanon_tz = pytz.timezone("Asia/Beirut")
reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/performance-overview', methods=['GET'])
@jwt_required()
def get_performance_overview():
    """Get comprehensive performance overview with key metrics for authenticated user"""
    try:
        # Get authenticated user ID from JWT token
        user_id = get_jwt_identity()
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        symbol = request.args.get('symbol', '').upper()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Base query filtered by authenticated user
        query = AISignals.query.filter(
            and_(
                AISignals.created_at >= start_date,
                AISignals.user_id == user_id
            )
        )
        
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        signals = query.all()
        
        if not signals:
            return jsonify({
                'success': True,
                'data': {'message': 'No signals found for the specified criteria'},
                'filters': {'days': days, 'symbol': symbol}
            })
        
        # Calculate key metrics
        total_signals = len(signals)
        completed_signals = [s for s in signals if s.result and s.result != 'ACTIVE']
        active_signals = [s for s in signals if s.result == 'ACTIVE' or not s.result]
        
        # Win rate calculation
        profitable_signals = [s for s in completed_signals if s.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']]
        losing_signals = [s for s in completed_signals if s.result == 'SL_HIT']
        
        win_rate = (len(profitable_signals) / len(completed_signals) * 100) if completed_signals else 0
        
        # Average confidence
        signals_with_confidence = [s for s in signals if s.confidence is not None]
        avg_confidence = sum(s.confidence for s in signals_with_confidence) / len(signals_with_confidence) if signals_with_confidence else 0
        
        # Signal frequency (signals per day)
        signal_frequency = total_signals / days if days > 0 else 0
        
        # Take profit level analysis
        tp_analysis = {1: 0, 2: 0, 3: 0}
        for signal in completed_signals:
            if signal.hit_tp_level:
                tp_analysis[signal.hit_tp_level] = tp_analysis.get(signal.hit_tp_level, 0) + 1
        
        # Recent performance trend (last 7 days vs previous period)
        recent_date = end_date - timedelta(days=7)
        recent_signals = [s for s in signals if s.created_at >= recent_date]
        previous_signals = [s for s in signals if s.created_at < recent_date]
        
        recent_completed = [s for s in recent_signals if s.result and s.result != 'ACTIVE']
        previous_completed = [s for s in previous_signals if s.result and s.result != 'ACTIVE']
        
        recent_win_rate = (len([s for s in recent_completed if s.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']]) / len(recent_completed) * 100) if recent_completed else 0
        previous_win_rate = (len([s for s in previous_completed if s.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']]) / len(previous_completed) * 100) if previous_completed else 0
        
        performance_trend = recent_win_rate - previous_win_rate
        
        overview_data = {
            'total_signals': total_signals,
            'completed_signals': len(completed_signals),
            'active_signals': len(active_signals),
            'win_rate': round(win_rate, 2),
            'average_confidence': round(avg_confidence, 2),
            'signal_frequency_per_day': round(signal_frequency, 2),
            'profitable_signals': len(profitable_signals),
            'losing_signals': len(losing_signals),
            'take_profit_distribution': tp_analysis,
            'performance_trend': {
                'recent_win_rate': round(recent_win_rate, 2),
                'previous_win_rate': round(previous_win_rate, 2),
                'trend_change': round(performance_trend, 2)
            },
            'period_info': {
                'days': days,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        }
        
        return jsonify({
            'success': True,
            'data': overview_data,
            'filters': {'days': days, 'symbol': symbol}
        })
        
    except Exception as e:
        print(f"Error in performance overview: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500

@reports_bp.route('/timeframe-analysis', methods=['GET'])
@jwt_required()
def get_timeframe_analysis():
    """Analyze performance across different timeframes for authenticated user"""
    try:
        # Get authenticated user ID from JWT token
        user_id = get_jwt_identity()
        
        days = request.args.get('days', 30, type=int)
        symbol = request.args.get('symbol', '').upper()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = AISignals.query.filter(
            and_(
                AISignals.created_at >= start_date,
                AISignals.user_id == user_id
            )
        )
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        signals = query.all()
        
        # Group by timeframe
        timeframe_data = defaultdict(lambda: {
            'total_signals': 0,
            'completed_signals': 0,
            'profitable_signals': 0,
            'losing_signals': 0,
            'active_signals': 0,
            'confidence_sum': 0,
            'confidence_count': 0,
            'tp_levels': {1: 0, 2: 0, 3: 0}
        })
        
        for signal in signals:
            tf = signal.timeframe
            data = timeframe_data[tf]
            
            data['total_signals'] += 1
            
            if signal.result == 'ACTIVE' or not signal.result:
                data['active_signals'] += 1
            else:
                data['completed_signals'] += 1
                if signal.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']:
                    data['profitable_signals'] += 1
                elif signal.result == 'SL_HIT':
                    data['losing_signals'] += 1
                
                if signal.hit_tp_level:
                    data['tp_levels'][signal.hit_tp_level] += 1
            
            if signal.confidence is not None:
                data['confidence_sum'] += signal.confidence
                data['confidence_count'] += 1
        
        # Calculate metrics for each timeframe
        analysis_results = []
        for timeframe, data in timeframe_data.items():
            win_rate = (data['profitable_signals'] / data['completed_signals'] * 100) if data['completed_signals'] > 0 else 0
            avg_confidence = (data['confidence_sum'] / data['confidence_count']) if data['confidence_count'] > 0 else 0
            
            analysis_results.append({
                'timeframe': timeframe,
                'total_signals': data['total_signals'],
                'completed_signals': data['completed_signals'],
                'active_signals': data['active_signals'],
                'win_rate': round(win_rate, 2),
                'average_confidence': round(avg_confidence, 2),
                'profitable_signals': data['profitable_signals'],
                'losing_signals': data['losing_signals'],
                'tp_distribution': data['tp_levels']
            })
        
        # Sort by total signals
        analysis_results.sort(key=lambda x: x['total_signals'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': analysis_results,
            'summary': {
                'total_timeframes_analyzed': len(analysis_results),
                'period_days': days,
                'symbol_filter': symbol or 'ALL'
            }
        })
        
    except Exception as e:
        print(f"Error in timeframe analysis: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500

@reports_bp.route('/symbol-performance', methods=['GET'])
@jwt_required()
def get_symbol_performance():
    """Analyze performance across different trading symbols for authenticated user"""
    try:
        # Get authenticated user ID from JWT token
        user_id = get_jwt_identity()
        
        days = request.args.get('days', 30, type=int)
        min_signals = request.args.get('min_signals', 5, type=int)  # Minimum signals to include symbol
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        signals = AISignals.query.filter(
            and_(
                AISignals.created_at >= start_date,
                AISignals.user_id == user_id
            )
        ).all()
        
        # Group by symbol
        symbol_data = defaultdict(lambda: {
            'total_signals': 0,
            'completed_signals': 0,
            'profitable_signals': 0,
            'losing_signals': 0,
            'active_signals': 0,
            'buy_signals': 0,
            'sell_signals': 0,
            'confidence_sum': 0,
            'confidence_count': 0,
            'timeframes': set(),
            'avg_time_to_complete': []
        })
        
        for signal in signals:
            symbol = signal.symbol
            data = symbol_data[symbol]
            
            data['total_signals'] += 1
            data['timeframes'].add(signal.timeframe)
            
            if signal.primary_signal == 'BUY':
                data['buy_signals'] += 1
            else:
                data['sell_signals'] += 1
            
            if signal.result == 'ACTIVE' or not signal.result:
                data['active_signals'] += 1
            else:
                data['completed_signals'] += 1
                if signal.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']:
                    data['profitable_signals'] += 1
                elif signal.result == 'SL_HIT':
                    data['losing_signals'] += 1
                
                # Calculate time to completion
                if signal.closed_at:
                    time_diff = (signal.closed_at - signal.created_at).total_seconds() / 3600  # hours
                    data['avg_time_to_complete'].append(time_diff)
            
            if signal.confidence is not None:
                data['confidence_sum'] += signal.confidence
                data['confidence_count'] += 1
        
        # Filter symbols with minimum signals and calculate metrics
        performance_results = []
        for symbol, data in symbol_data.items():
            if data['total_signals'] >= min_signals:
                win_rate = (data['profitable_signals'] / data['completed_signals'] * 100) if data['completed_signals'] > 0 else 0
                avg_confidence = (data['confidence_sum'] / data['confidence_count']) if data['confidence_count'] > 0 else 0
                avg_completion_time = sum(data['avg_time_to_complete']) / len(data['avg_time_to_complete']) if data['avg_time_to_complete'] else 0
                
                performance_results.append({
                    'symbol': symbol,
                    'total_signals': data['total_signals'],
                    'completed_signals': data['completed_signals'],
                    'active_signals': data['active_signals'],
                    'win_rate': round(win_rate, 2),
                    'average_confidence': round(avg_confidence, 2),
                    'profitable_signals': data['profitable_signals'],
                    'losing_signals': data['losing_signals'],
                    'buy_signals': data['buy_signals'],
                    'sell_signals': data['sell_signals'],
                    'timeframes_used': list(data['timeframes']),
                    'avg_completion_hours': round(avg_completion_time, 2)
                })
        
        # Sort by win rate
        performance_results.sort(key=lambda x: x['win_rate'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': performance_results,
            'summary': {
                'symbols_analyzed': len(performance_results),
                'total_symbols_found': len(symbol_data),
                'min_signals_threshold': min_signals,
                'period_days': days
            }
        })
        
    except Exception as e:
        print(f"Error in symbol performance: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500

@reports_bp.route('/confidence-analysis', methods=['GET'])
@jwt_required()
def get_confidence_analysis():
    """Analyze signal performance based on confidence levels for authenticated user"""
    try:
        # Get authenticated user ID from JWT token
        user_id = get_jwt_identity()
        
        days = request.args.get('days', 30, type=int)
        symbol = request.args.get('symbol', '').upper()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = AISignals.query.filter(
            and_(
                AISignals.created_at >= start_date,
                AISignals.user_id == user_id,
                AISignals.confidence.isnot(None)
            )
        )
        
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        signals = query.all()
        
        if not signals:
            return jsonify({
                'success': True,
                'data': {'message': 'No signals with confidence data found'},
                'filters': {'days': days, 'symbol': symbol}
            })
        
        # Define confidence ranges
        confidence_ranges = [
            {'min': 0, 'max': 50, 'label': 'Low (0-50)'},
            {'min': 51, 'max': 70, 'label': 'Medium (51-70)'},
            {'min': 71, 'max': 85, 'label': 'High (71-85)'},
            {'min': 86, 'max': 100, 'label': 'Very High (86-100)'}
        ]
        
        confidence_analysis = []
        
        for range_config in confidence_ranges:
            range_signals = [s for s in signals if range_config['min'] <= s.confidence <= range_config['max']]
            
            if not range_signals:
                continue
            
            completed_signals = [s for s in range_signals if s.result and s.result != 'ACTIVE']
            profitable_signals = [s for s in completed_signals if s.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']]
            
            win_rate = (len(profitable_signals) / len(completed_signals) * 100) if completed_signals else 0
            avg_confidence = sum(s.confidence for s in range_signals) / len(range_signals)
            
            confidence_analysis.append({
                'confidence_range': range_config['label'],
                'min_confidence': range_config['min'],
                'max_confidence': range_config['max'],
                'total_signals': len(range_signals),
                'completed_signals': len(completed_signals),
                'profitable_signals': len(profitable_signals),
                'win_rate': round(win_rate, 2),
                'average_confidence': round(avg_confidence, 2)
            })
        
        # Overall confidence correlation
        completed_all = [s for s in signals if s.result and s.result != 'ACTIVE']
        if completed_all:
            # Correlation between confidence and success
            profitable_confidences = [s.confidence for s in completed_all if s.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']]
            losing_confidences = [s.confidence for s in completed_all if s.result == 'SL_HIT']
            
            avg_profitable_confidence = sum(profitable_confidences) / len(profitable_confidences) if profitable_confidences else 0
            avg_losing_confidence = sum(losing_confidences) / len(losing_confidences) if losing_confidences else 0
            
            correlation_data = {
                'average_profitable_confidence': round(avg_profitable_confidence, 2),
                'average_losing_confidence': round(avg_losing_confidence, 2),
                'confidence_difference': round(avg_profitable_confidence - avg_losing_confidence, 2)
            }
        else:
            correlation_data = None
        
        return jsonify({
            'success': True,
            'data': {
                'confidence_ranges': confidence_analysis,
                'correlation_analysis': correlation_data,
                'total_signals_analyzed': len(signals)
            },
            'filters': {'days': days, 'symbol': symbol}
        })
        
    except Exception as e:
        print(f"Error in confidence analysis: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500

@reports_bp.route('/daily-activity', methods=['GET'])
@jwt_required()
def get_daily_activity():
    """Get daily signal generation activity and patterns for authenticated user"""
    try:
        # Get authenticated user ID from JWT token
        user_id = get_jwt_identity()
        
        days = request.args.get('days', 30, type=int)
        symbol = request.args.get('symbol', '').upper()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = AISignals.query.filter(
            and_(
                AISignals.created_at >= start_date,
                AISignals.user_id == user_id
            )
        )
        if symbol:
            query = query.filter(AISignals.symbol == symbol)
        
        signals = query.order_by(AISignals.created_at.asc()).all()
        
        # Group signals by date
        daily_data = defaultdict(lambda: {
            'date': None,
            'total_signals': 0,
            'buy_signals': 0,
            'sell_signals': 0,
            'completed_signals': 0,
            'profitable_signals': 0,
            'avg_confidence': 0,
            'confidence_sum': 0,
            'confidence_count': 0
        })
        
        for signal in signals:
            date_key = signal.created_at.date()
            data = daily_data[date_key]
            data['date'] = date_key.isoformat()
            data['total_signals'] += 1
            
            if signal.primary_signal == 'BUY':
                data['buy_signals'] += 1
            else:
                data['sell_signals'] += 1
            
            if signal.result and signal.result != 'ACTIVE':
                data['completed_signals'] += 1
                if signal.result in ['TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'COMPLETED']:
                    data['profitable_signals'] += 1
            
            if signal.confidence is not None:
                data['confidence_sum'] += signal.confidence
                data['confidence_count'] += 1
        
        # Calculate averages and format data
        activity_data = []
        for date_key in sorted(daily_data.keys()):
            data = daily_data[date_key]
            avg_confidence = (data['confidence_sum'] / data['confidence_count']) if data['confidence_count'] > 0 else 0
            
            activity_data.append({
                'date': data['date'],
                'total_signals': data['total_signals'],
                'buy_signals': data['buy_signals'],
                'sell_signals': data['sell_signals'],
                'completed_signals': data['completed_signals'],
                'profitable_signals': data['profitable_signals'],
                'average_confidence': round(avg_confidence, 2)
            })
        
        # Calculate summary statistics
        total_days_with_activity = len([d for d in activity_data if d['total_signals'] > 0])
        avg_signals_per_day = sum(d['total_signals'] for d in activity_data) / len(activity_data) if activity_data else 0
        most_active_day = max(activity_data, key=lambda x: x['total_signals']) if activity_data else None
        
        return jsonify({
            'success': True,
            'data': {
                'daily_activity': activity_data,
                'summary': {
                    'total_days_analyzed': days,
                    'days_with_activity': total_days_with_activity,
                    'average_signals_per_day': round(avg_signals_per_day, 2),
                    'most_active_day': most_active_day
                }
            },
            'filters': {'days': days, 'symbol': symbol}
        })
        
    except Exception as e:
        print(f"Error in daily activity: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500