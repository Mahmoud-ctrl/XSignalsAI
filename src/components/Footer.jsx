import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Zap, Shield, Target, ChevronRight, Play, Users, Award, Clock, Bot, Star, CheckCircle, XCircle } from 'lucide-react';
import { FaFacebook, FaTwitter, FaTelegram } from "react-icons/fa";

const Footer = () => {
  return (
      <div className="bg-[#080809] border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-4 md:col-span-1 mb-8 md:mb-0">
              <a href="#" className="flex items-center space-x-2 mb-4">
                <img
                    src="https://lebwork.b-cdn.net/XSignalsAI-logo.png"
                    alt="XSignals AI"
                    height={140}
                    width={140}
                  />
              </a>
              <p className="text-gray-400 text-sm">AI-powered crypto trading signals for the modern trader.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-orange-400">Features</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-orange-400">Pricing</a></li>
                <li><a href="#steps" className="text-gray-400 hover:text-orange-400">Get Started</a></li>
              </ul>
            </div>
        
             <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-orange-400">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-orange-400">Disclaimer</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://t.me/XSignalsAI" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 flex items-center gap-2"
                  >
                    <FaTelegram /> Telegram
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/XSignalsAI" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 flex items-center gap-2"
                  >
                    <FaFacebook /> Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.x.com/XSignalsAI" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 flex items-center gap-2"
                  >
                    <FaTwitter /> Twitter/X
                  </a>
                </li>
              </ul>
            </div>

          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} SignalAI. All Rights Reserved.</p>
          </div>
        </div>
      </div>
  );
};

export default Footer;