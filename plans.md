# Plan-Based Trading System Implementation Guide

## Overview

This enhanced system implements tiered features based on user subscription plans: **Free**, **Premium**, and **Pro**. Each plan has different limitations and capabilities.

## Plan Configurations

### Free Plan
- **Max Pairs**: 1
- **Scans/Hour**: 5  
- **Take Profit Levels**: 1 (TP1 only)
- **AI Models**: Pre-selected (deepseek free only)
- **Timeframes**: Limited to 5m and 1h only
- **AI Response Visibility**: Hidden
- **Features**: Basic signals only

### Premium Plan  
- **Max Pairs**: 5
- **Scans/Hour**: 20
- **Take Profit Levels**: 2 (TP1 + TP2)
- **AI Models**: 2 options (deepseek + claude)
- **Timeframes**: All timeframes available
- **AI Response Visibility**: Hidden
- **Features**: Advanced signals, risk analysis

### Pro Plan
- **Max Pairs**: 20
- **Scans/Hour**: 100
- **Take Profit Levels**: 3 (TP1 + TP2 + TP3)
- **AI Models**: 5+ options (deepseek, claude, gpt-4, gemini, llama)
- **Timeframes**: All timeframes available
- **AI Response Visibility**: Full AI response visible
- **Features**: Premium signals, all features, priority support

## Key Changes Made

### 1. ComprehensiveAnalyzer Class Enhancement

```python
# Initialize with plan-based configuration
analyzer = ComprehensiveAnalyzer(
    user_plan='premium',           # Plan tier
    ai_model='anthropic/claude-3.5-sonnet',  # Optional AI model selection
    user_id=current_user
)
```

#### New Methods:
- `get_available_ai_models()` - Returns AI models available for user's plan
- `get_plan_features()` - Returns complete plan configuration
- `filter_timeframes_by_plan()` - Filters timeframes based on plan limitations
- `filter_take_profits_by_plan()` - Limits TP levels based on plan

### 2. AI Prompt Enhancement

The AI now receives plan-specific instructions:
- Knows user's plan tier
- Instructed to provide exact number of TP levels
- Adjusted confidence thresholds for premium/pro users

### 3. Database Integration

Enhanced database saving with plan validation:
- Validates TP levels match user's plan
- Stores plan information in signal metadata
- Tracks which AI model was used

## New API Endpoints

### 1. Get Available AI Models
```http
GET /available-ai-models
Authorization: Bearer <jwt_token>
```

Response:
```json
{
    "success": true,
    "user_plan": "premium",
    "available_models": [
        "deepseek/deepseek-r1-0528-qwen3-8b:free",
        "anthropic/claude-3.5-sonnet"
    ],
    "current_default": "deepseek/deepseek-r1-0528-qwen3-8b:free",
    "plan_features": {
        "plan": "premium",
        "max_pairs": 5,
        "take_profit_levels": 2,
        "show_ai_response": false
    }
}
```

### 2. Get Plan Information
```http
GET /plan-info
Authorization: Bearer <jwt_token>
```

Response:
```json
{
    "success": true,
    "user_plan": "free",
    "plan_limits": {
        "max_pairs": 1,
        "max_scans_per_hour": 5,
        "take_profit_levels": 1,
        "show_ai_response": false
    },
    "upgrade_benefits": {
        "premium": {
            "additional_pairs": 4,
            "additional_tp_levels": 1,
            "additional_ai_models": 1
        },
        "pro": {
            "additional_pairs": 19,
            "additional_tp_levels": 2,
            "additional_ai_models": 4,
            "ai_response_access": true
        }
    }
}
```

### 3. Enhanced Comprehensive Analysis
```http
POST /comprehensive-analysis
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "symbol": "BTCUSDT",
    "timeframes": ["5m", "1h", "4h", "1d"],
    "ai_model": "anthropic/claude-3.5-sonnet"  // Optional, must be in user's plan
}
```

Response includes plan-specific data:
```json
{
    "symbol": "BTCUSDT",
    "user_plan_info": {
        "plan": "premium",
        "take_profit_levels": 2,
        "current_ai_model": "anthropic/claude-3.5-sonnet",
        "show_ai_response": false
    },
    "ai_signal": {
        "primary_signal": "BUY",
        "entry_zone": [50000, 50200],
        "stop_loss": 49500,
        "take_profits": [51000, 52000],  // Only 2 TPs for premium
        "plan_info": {
            "user_plan": "premium",
            "tp_levels_allowed": 2,
            "tp_levels_provided": 2
        }
    },
    "plan_limitations_applied": {
        "timeframes_filtered": false,
        "tp_levels_limited": false
    },
    "ai_analysis": "AI response hidden for your plan"
}
```

## Frontend Integration

### 1. Plan-Based UI Elements

```javascript
// Check user plan before showing features
if (userPlan === 'pro') {
    showAIResponseSection();
    enableMultipleAISelection();
}

// Limit TP input fields based on plan
const maxTPLevels = planInfo.take_profit_levels;
renderTPInputs(maxTPLevels);

// Show upgrade prompts
if (userPlan === 'free') {
    showUpgradePrompt('Need more TP levels? Upgrade to Premium!');
}
```

### 2. AI Model Selection

```javascript
// Fetch available models
const response = await fetch('/available-ai-models', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const { available_models } = await response.json();

// Render dropdown
renderAIModelDropdown(available_models);
```

### 3. Display Trade Signals

```javascript
// Show only allowed TP levels
const tpLevels = signal.take_profits.slice(0, planInfo.take_profit_levels);

// Hide AI response for non-pro users
if (planInfo.show_ai_response) {
    showAIResponseSection(signal.ai_analysis);
} else {
    showUpgradePrompt('Want to see the AI reasoning? Upgrade to Pro!');
}
```

## Database Requirements

### User Model Update
Add plan information to your User model:

```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ... existing fields
    plan = db.Column(db.String(20), default='free')  # 'free', 'premium', 'pro'
    plan_expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### AISignals Model (if changes needed)
The existing model should work, but you might want to add:

```python
class AISignals(db.Model):
    # ... existing fields
    ai_model_used = db.Column(db.String(100))  # Track which AI was used
    plan_at_creation = db.Column(db.String(20))  # Track user's plan when signal was created
```

## Usage Examples

### 1. Basic Free User Flow
```python
# User with free plan gets limited analysis
analyzer = ComprehensiveAnalyzer(user_plan='free', user_id=123)

# Only 5m and 1h timeframes will be analyzed
result = analyzer.analyze_multiple_timeframes('BTCUSDT', ['5m', '1h', '4h', '1d'])
# Returns: {'5m': {...}, '1h': {...}}  # 4h and 1d filtered out

# AI will provide only 1 TP level
ai_signal = {
    "take_profits": [51000],  # Only TP1
    "plan_info": {
        "user_plan": "free",
        "tp_levels_allowed": 1
    }
}
```

### 2. Premium User with AI Selection
```python
# Premium user selects Claude AI
analyzer = ComprehensiveAnalyzer(
    user_plan='premium', 
    ai_model='anthropic/claude-3.5-sonnet',
    user_id=456
)

# Gets 2 TP levels
ai_signal = {
    "take_profits": [51000, 52000],  # TP1 and TP2
    "plan_info": {
        "user_plan": "premium", 
        "ai_model_used": "anthropic/claude-3.5-sonnet",
        "tp_levels_allowed": 2
    }
}
```

### 3. Pro User Full Access
```python
# Pro user gets everything
analyzer = ComprehensiveAnalyzer(
    user_plan='pro',
    ai_model='openai/gpt-4-turbo', 
    user_id=789
)

# Full response including AI reasoning
response = {
    "ai_analysis": "Full detailed AI response visible...",
    "ai_signal": {
        "take_profits": [51000, 52000, 53000],  # All 3 TPs
        "plan_info": {
            "user_plan": "pro",
            "tp_levels_allowed": 3
        }
    },
    "user_plan_info": {
        "show_ai_response": true
    }
}
```

## Testing

### Test Different Plans
```http
GET /test-comprehensive?symbol=BTCUSDT&plan=free
GET /test-comprehensive?symbol=BTCUSDT&plan=premium&ai_model=anthropic/claude-3.5-sonnet
GET /test-comprehensive?symbol=BTCUSDT&plan=pro&ai_model=openai/gpt-4-turbo
```

## Migration Steps

1. **Update User Model**: Add plan field to users table
2. **Deploy Enhanced Classes**: Replace existing analyzer with plan-aware version
3. **Update Frontend**: Add plan-based UI elements
4. **Test Thoroughly**: Verify each plan tier works correctly
5. **Add Upgrade Flows**: Implement plan upgrade/downgrade logic

## Benefits

- **Monetization**: Clear value differentiation between plans
- **Scalability**: Easy to add new AI models and features
- **User Experience**: Progressive feature unlock encourages upgrades
- **Cost Management**: Limits expensive AI calls for free users
- **Flexibility**: Easy to adjust plan limits without code changes