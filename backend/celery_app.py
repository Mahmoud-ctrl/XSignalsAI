# celery_app.py
from celery import Celery

celery = Celery('app')
celery.conf.update(
    broker_url="redis://localhost:6379/0",
    result_backend="redis://localhost:6379/0",
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    result_expires=3600,
    timezone='Asia/Beirut',
    enable_utc=True,
    # Include tasks from the blueprint
    include=['blueprints.comprehensive_analysis', 'tasks']
)
