import base64
from datetime import date, timedelta

def format_timedelta(delta):
    """Převede timedelta na řetězec ve formátu HH:MM:SS"""
    if isinstance(delta, timedelta):
        total_seconds = int(delta.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02}:{minutes:02}:{seconds:02}"
    return delta  # Pokud není timedelta, vrátí původní hodnotu

def get_formated_event_driver_event_results(row):
    return {
        "lap": row[0],
        "time": row[1],
    }