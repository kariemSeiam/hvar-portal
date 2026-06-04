"""
Clean Logging Utility
Provides colored console output for system status and operations
"""

import sys
from datetime import datetime

class CleanLog:
    """Clean logging utility with colored output"""
    
    # ANSI color codes
    COLORS = {
        'reset': '\033[0m',
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'cyan': '\033[96m',
        'white': '\033[97m',
        'bold': '\033[1m',
        'dim': '\033[2m'
    }
    
    def __init__(self):
        self.timestamp_format = "%H:%M:%S"
    
    def _print(self, message: str, color: str = 'reset', prefix: str = ""):
        """Print colored message with timestamp"""
        timestamp = datetime.now().strftime(self.timestamp_format)
        colored_message = f"{self.COLORS[color]}{prefix}{message}{self.COLORS['reset']}"
        print(f"[{timestamp}] {colored_message}")
        sys.stdout.flush()
    
    def info(self, message: str):
        """Print info message in blue"""
        self._print(message, 'blue', "ℹ️  ")
    
    def success(self, message: str):
        """Print success message in green"""
        self._print(message, 'green', "✅ ")
    
    def warning(self, message: str):
        """Print warning message in yellow"""
        self._print(message, 'yellow', "⚠️  ")
    
    def error(self, message: str):
        """Print error message in red"""
        self._print(message, 'red', "❌ ")
    
    def sync_status(self, message: str):
        """Print sync status message in cyan"""
        self._print(message, 'cyan', "🔄 ")
    
    def debug(self, message: str):
        """Print debug message in dim white"""
        self._print(message, 'dim', "🔍 ")

# Global instance
clean_log = CleanLog() 