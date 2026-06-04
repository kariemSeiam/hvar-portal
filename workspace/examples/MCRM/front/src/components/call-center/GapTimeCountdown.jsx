import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Gap Time Countdown Component
 * Simple countdown timer until order becomes available
 */
const GapTimeCountdown = ({ nextActionAt, showIcon = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    if (!nextActionAt) {
      setIsAvailable(true);
      return;
    }
    
    const updateCountdown = () => {
      const now = new Date();
      const next = new Date(nextActionAt);
      const diff = next - now;
      
      if (diff <= 0) {
        setIsAvailable(true);
        setTimeRemaining(null);
        return;
      }
      
      setIsAvailable(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining({ hours, minutes });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [nextActionAt]);
  
  if (isAvailable || !timeRemaining) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400" dir="rtl">
      {showIcon && (
        <Clock className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="font-medium">
        متاح خلال: {timeRemaining.hours}س {timeRemaining.minutes}د
      </span>
    </div>
  );
};

export default GapTimeCountdown;
