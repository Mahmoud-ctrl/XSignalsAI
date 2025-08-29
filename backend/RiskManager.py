import numpy as np

class RiskManager:
    """Handles all risk management and validation operations"""
    
    def validate_entry_opportunity(self, current_price, entry_zone, signal_type):
        if not current_price or not entry_zone:
            return {
                'status': 'UNKNOWN',
                'message': '❓ Insufficient data to validate entry.'
            }

        entry_low = min(entry_zone)
        entry_high = max(entry_zone)

        def percent_diff(p1, p2):
            return abs(p1 - p2) / ((p1 + p2) / 2) * 100

        if signal_type.upper() == 'BUY':
            if entry_low <= current_price <= entry_high:
                return {
                    'status': 'OPTIMAL',
                    'message': f'✅ PERFECT ENTRY - Current price ${current_price:.2f} is within the entry zone ${entry_low:.2f} - ${entry_high:.2f}.'
                }
            elif current_price < entry_low:
                below_pct = percent_diff(current_price, entry_low)
                if below_pct <= 2.0:
                    return {
                        'status': 'STILL_VIABLE',
                        'message': f'📉 SLIGHTLY BELOW - Current price ${current_price:.2f} is just {below_pct:.1f}% under the zone. Viable if support holds.'
                    }
                else:
                    return {
                        'status': 'WAIT_FOR_BOUNCE',
                        'message': f'🕒 BELOW ZONE - Price ${current_price:.2f} is too low. Wait for bounce to ${entry_low:.2f}-${entry_high:.2f}.'
                    }
            else:
                above_pct = percent_diff(current_price, entry_high)
                if above_pct <= 2.0:
                    return {
                        'status': 'STILL_VIABLE',
                        'message': f'📈 SLIGHTLY ABOVE - Price ${current_price:.2f} is {above_pct:.1f}% over the zone. Entry still viable with reduced size or tight SL.'
                    }
                elif above_pct <= 4.0:
                    return {
                        'status': 'ENTRY_MISSED',
                        'message': f'⚠️ ENTRY MISSED - Current ${current_price:.2f} is {above_pct:.1f}% too high. Prefer pullback to ${entry_low:.2f}-${entry_high:.2f}.'
                    }
                else:
                    return {
                        'status': 'ENTRY_DEAD',
                        'message': f'❌ TOO LATE - Price is {above_pct:.1f}% above entry. Do not chase.'
                    }

        elif signal_type.upper() == 'SELL':
            if entry_low <= current_price <= entry_high:
                return {
                    'status': 'OPTIMAL',
                    'message': f'✅ PERFECT ENTRY - Current price ${current_price:.2f} is inside sell zone ${entry_low:.2f} - ${entry_high:.2f}.'
                }
            elif current_price > entry_high:
                above_pct = percent_diff(current_price, entry_high)
                if above_pct <= 2.0:
                    return {
                        'status': 'STILL_VIABLE',
                        'message': f'📈 SLIGHTLY ABOVE - Current ${current_price:.2f} is {above_pct:.1f}% over the zone. Still viable if resistance holds.'
                    }
                else:
                    return {
                        'status': 'WAIT_FOR_PULLBACK',
                        'message': f'🕒 ABOVE ZONE - Wait for pullback to ${entry_low:.2f}-${entry_high:.2f}.'
                    }
            else:
                below_pct = percent_diff(current_price, entry_low)
                if below_pct <= 2.0:
                    return {
                        'status': 'STILL_VIABLE',
                        'message': f'📉 SLIGHTLY BELOW - Current ${current_price:.2f} is {below_pct:.1f}% under the zone. Entry still possible.'
                    }
                elif below_pct <= 4.0:
                    return {
                        'status': 'ENTRY_MISSED',
                        'message': f'⚠️ ENTRY MISSED - Price too far below zone. Wait for bounce to ${entry_low:.2f}-${entry_high:.2f}.'
                    }
                else:
                    return {
                        'status': 'ENTRY_DEAD',
                        'message': f'❌ TOO LOW - Price ${current_price:.2f} is too far below. Avoid chasing.'
                    }

        return {
            'status': 'NEUTRAL',
            'message': '🤷 No entry guidance for neutral/wait signals.'
        }

    def calculate_sensible_stop_loss(self, entry_zone, signal_type, current_price, atr, support, resistance, 
                               timeframe='4h', volatility_regime='normal'):
        """Calculate improved stop loss that accounts for crypto volatility and reduces premature exits"""
        if not entry_zone or not current_price or not atr:
            return None
        
        timeframe_multipliers = {
            '1h': 2.0,
            '4h': 2.5,
            '1d': 3.0,
            '1w': 3.5
        }
        
        volatility_multipliers = {
            'low': 0.8,
            'normal': 1.0,
            'high': 1.3
        }
        
        base_multiplier = timeframe_multipliers.get(timeframe, 2.5)
        volatility_adj = volatility_multipliers.get(volatility_regime, 1.0)
        atr_multiplier = base_multiplier * volatility_adj
        
        atr_stop_distance = atr * atr_multiplier
        
        if atr > current_price * 0.025:
            max_percent_stop = 4.5
        elif atr > current_price * 0.015:
            max_percent_stop = 3.5
        else:
            max_percent_stop = 2.5
        
        max_dollar_stop = current_price * (max_percent_stop / 100)
        base_stop_distance = min(atr_stop_distance, max_dollar_stop)
        
        if signal_type.upper() == 'BUY':
            entry_reference = min(entry_zone)
            preliminary_stop = entry_reference - base_stop_distance
            
            if not np.isnan(support) and support > 0:
                support_stop = support - (atr * 0.8)
                max_support_distance = entry_reference * 0.06
                if (entry_reference - support_stop) <= max_support_distance:
                    preliminary_stop = min(preliminary_stop, support_stop)
            
            min_stop_distance = max(atr * 1.5, current_price * 0.015)
            min_allowed_stop = entry_reference - min_stop_distance
            stop_loss = min(preliminary_stop, min_allowed_stop)
            
            if stop_loss >= entry_reference:
                stop_loss = entry_reference - min_stop_distance
                
        elif signal_type.upper() == 'SELL':
            entry_reference = max(entry_zone)
            preliminary_stop = entry_reference + base_stop_distance
            
            if not np.isnan(resistance) and resistance > 0:
                resistance_stop = resistance + (atr * 0.8)
                max_resistance_distance = entry_reference * 0.06
                if (resistance_stop - entry_reference) <= max_resistance_distance:
                    preliminary_stop = max(preliminary_stop, resistance_stop)
            
            min_stop_distance = max(atr * 1.5, current_price * 0.015)
            max_allowed_stop = entry_reference + min_stop_distance
            stop_loss = max(preliminary_stop, max_allowed_stop)
            
            if stop_loss <= entry_reference:
                stop_loss = entry_reference + min_stop_distance
        else:
            return None
        
        return round(stop_loss, 5)