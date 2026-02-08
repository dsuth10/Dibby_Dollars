"""
Background Scheduler

Schedules daily snapshots and weekly interest calculations.
Uses APScheduler.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit


scheduler = BackgroundScheduler()


def init_scheduler(app):
    """Initialize and start the background scheduler."""
    
    def daily_snapshot_job():
        """Run daily snapshot with app context."""
        with app.app_context():
            from api.services.interest import take_daily_snapshot
            count = take_daily_snapshot()
            print(f"[Scheduler] Daily snapshot complete: {count} snapshots created")
    
    def weekly_interest_job():
        """Run weekly interest calculation with app context."""
        with app.app_context():
            from api.services.interest import calculate_weekly_interest
            result = calculate_weekly_interest()
            print(f"[Scheduler] Weekly interest complete: {result}")
    
    # Daily snapshot at 23:55 every day
    scheduler.add_job(
        daily_snapshot_job,
        trigger=CronTrigger(hour=23, minute=55),
        id='daily_snapshot',
        name='Daily Balance Snapshot',
        replace_existing=True
    )
    
    # Weekly interest calculation at 23:59 every Sunday
    scheduler.add_job(
        weekly_interest_job,
        trigger=CronTrigger(day_of_week='sun', hour=23, minute=59),
        id='weekly_interest',
        name='Weekly Interest Calculation',
        replace_existing=True
    )
    
    # Start scheduler
    scheduler.start()
    
    # Shut down scheduler when app exits
    atexit.register(lambda: scheduler.shutdown(wait=False))
    
    print("[Scheduler] Background scheduler initialized")
