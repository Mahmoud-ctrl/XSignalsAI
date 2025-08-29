import React, { useState, useEffect } from 'react';

const EngagingCryptoLoader = ({ customSymbol = "BTC", initialSymbol = "ETH" }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const analysisSteps = [
    {
      title: "Connecting to Market Data",
      description: "Fetching real-time price feeds and order book data...",
      icon: "🔗",
      duration: 1500
    },
    {
      title: "Technical Analysis",
      description: "Calculating RSI, MACD, Bollinger Bands, and support/resistance levels...",
      icon: "📊",
      duration: 2000
    },
    {
      title: "Sentiment Analysis",
      description: "Analyzing social media sentiment and news impact...",
      icon: "🧠",
      duration: 1800
    },
    {
      title: "Pattern Recognition",
      description: "Identifying chart patterns and market structure...",
      icon: "🔍",
      duration: 1600
    },
    {
      title: "Risk Assessment",
      description: "Calculating volatility metrics and risk-reward ratios...",
      icon: "⚖️",
      duration: 1400
    },
    {
      title: "AI Signal Generation",
      description: "Processing data through neural networks for final signals...",
      icon: "🤖",
      duration: 2200
    }
  ];

  useEffect(() => {
    let stepInterval;
    let progressInterval;
    
    // Progress animation
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 3;
      });
    }, 150);

    // Step progression
    stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 2000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStepData = analysisSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl animate-pulse">🚀</span>
            Analyzing {customSymbol || initialSymbol}
          </h1>
          <div className="text-right">
            <div className="text-orange-500 font-bold text-lg">
              {Math.min(100, Math.floor(progress))}%
            </div>
            <div className="text-gray-400 text-sm">Complete</div>
          </div>
        </div>

        {/* Main Loading Card */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 mb-6">
          <div className="text-center mb-8">
            {/* Animated Icon */}
            <div className="text-6xl mb-4 animate-bounce">
              {currentStepData.icon}
            </div>
            
            {/* Current Step */}
            <h2 className="text-2xl font-semibold text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-400 mb-6">
              {currentStepData.description}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>

            {/* Spinning Loader */}
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-orange-500 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Steps Timeline */}
        <div className="bg-gray-800/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📋</span> Analysis Pipeline
          </h3>
          <div className="space-y-3">
            {analysisSteps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                  index < currentStep 
                    ? 'bg-green-900/30 border border-green-600/50' 
                    : index === currentStep
                    ? 'bg-orange-900/30 border border-orange-600/50 animate-pulse'
                    : 'bg-gray-800/30 border border-gray-600/30'
                }`}
              >
                <div className="text-2xl">
                  {index < currentStep ? '✅' : index === currentStep ? step.icon : '⏳'}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    index <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {index === currentStep && (
                    <div className="text-sm text-gray-400 animate-fade-in">
                      {step.description}
                    </div>
                  )}
                </div>
                {index < currentStep && (
                  <div className="text-green-400 font-bold">DONE</div>
                )}
                {index === currentStep && (
                  <div className="text-orange-400 font-bold animate-pulse">PROCESSING</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fun Facts Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <span className="animate-pulse">💡</span>
            Did you know? Our AI analyzes over 150+ indicators in real-time to generate signals
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngagingCryptoLoader;