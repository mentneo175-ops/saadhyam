"""
Centralized Logging Configuration
Reduces log noise and improves performance
"""

import logging
import sys
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


def configure_logging(environment: str = "development"):
    """
    Configure logging for the entire application.
    
    Args:
        environment: "development" or "production"
    """
    # Force stdout and stderr to use UTF-8 encoding to prevent UnicodeEncodeError with emojis on Windows
    try:
        if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
    
    # Base log level based on environment
    if environment == "production":
        base_level = logging.WARNING
        console_level = logging.ERROR
    else:
        base_level = logging.INFO
        console_level = logging.INFO
    
    # Configure root logger
    logging.basicConfig(
        level=base_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            # Console handler (reduced verbosity)
            logging.StreamHandler(sys.stdout),
            # File handler for errors
            logging.FileHandler(LOGS_DIR / "error.log", mode="a"),
        ]
    )
    
    # Set specific logger levels to reduce noise
    loggers_config = {
        # Reduce uvicorn access logs (only show errors)
        "uvicorn.access": logging.ERROR,
        "uvicorn.error": logging.ERROR,
        
        # Reduce authentication logs (only warnings and errors)
        "utils.dependencies": logging.WARNING,
        
        # Reduce scheduler logs (only when processing posts)
        "services.scheduler": logging.INFO,
        "apscheduler.executors.default": logging.WARNING,
        "apscheduler.scheduler": logging.WARNING,
        
        # Keep important service logs visible
        "services": logging.INFO,
        "routes": logging.INFO,
        
        # Reduce database query logs
        "sqlalchemy.engine": logging.WARNING,
        
        # Reduce HTTP client logs
        "httpx": logging.WARNING,
        "httpcore": logging.WARNING,
        
        # Main app logger
        "main": logging.INFO,
    }
    
    for logger_name, level in loggers_config.items():
        logging.getLogger(logger_name).setLevel(level)
    
    # Create a custom formatter for console output (cleaner)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(console_level)
    console_formatter = logging.Formatter(
        "%(levelname)s: %(message)s"  # Simpler format for console
    )
    console_handler.setFormatter(console_formatter)
    
    # Apply to root logger
    root_logger = logging.getLogger()
    root_logger.handlers = [console_handler]
    
    logging.info("✅ Logging configured successfully")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
