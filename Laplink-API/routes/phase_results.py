from fastapi import FastAPI, APIRouter, Depends
from fastapi.security.api_key import APIKey
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from db.connection import prioritized_get_db_connection
import logging
import service.auth as auth

# Inicializace loggeru
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializace plánovače
scheduler = BackgroundScheduler()

# FastAPI aplikace
app = FastAPI()

# API router
router = APIRouter()

# Funkce pro aktualizaci průběžných výsledků
def update_interim_results(event_id: int, event_phase_id: int):
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        # Volání uložené procedury pro průběžné výsledky
        cursor.callproc("UpdateActiveEventPhaseResults", (event_id, event_phase_id))
        db_connection.commit()
        logger.info(f"Interim results updated for event_id={event_id}, event_phase_id={event_phase_id}")
    except Exception as e:
        db_connection.rollback()
        logger.error(f"Error updating interim results for event_id={event_id}, event_phase_id={event_phase_id}: {e}")
    finally:
        cursor.close()
        db_connection.close()

# Endpoint pro spuštění plánovače pro konkrétní závod a fázi
@router.post("/start-event-update", response_model=dict)
async def start_event_update(
    event_id: int,
    event_phase_id: int,
    api_key: APIKey = Depends(auth.get_api_key)
):
    scheduler.start()
    job_id = f"interim_results_event_{event_id}_phase_{event_phase_id}"
    if scheduler.get_job(job_id):
        return {"status": "error", "message": f"Update already running for event_id={event_id}, event_phase_id={event_phase_id}"}

    scheduler.add_job(
        update_interim_results,
        trigger=IntervalTrigger(seconds=15),
        args=[event_id, event_phase_id],
        id=job_id,
        name=f"Interim results for event {event_id} phase {event_phase_id}",
        replace_existing=True,
    )
    logger.info(f"Scheduled job for event_id={event_id}, event_phase_id={event_phase_id}")
    return {"status": "success", "message": f"Update started for event_id={event_id}, event_phase_id={event_phase_id}"}

# Endpoint pro zastavení aktualizace pro konkrétní závod a fázi
@router.post("/stop-event-update", response_model=dict)
async def stop_event_update(
    event_id: int,
    event_phase_id: int,
    api_key: APIKey = Depends(auth.get_api_key)
):
    job_id = f"interim_results_event_{event_id}_phase_{event_phase_id}"
    if not scheduler.get_job(job_id):
        return {"status": "error", "message": f"No running update for event_id={event_id}, event_phase_id={event_phase_id}"}

    scheduler.remove_job(job_id)
    scheduler.shutdown()
    logger.info(f"Stopped job for event_id={event_id}, event_phase_id={event_phase_id}")
    return {"status": "success", "message": f"Update stopped for event_id={event_id}, event_phase_id={event_phase_id}"}

# Endpoint pro ruční spuštění aktualizace
@router.post("/manual-update-event-results", response_model=dict)
async def manual_update_event_results(
    event_id: int,
    event_phase_id: int,
    api_key: APIKey = Depends(auth.get_api_key)
):
    try:
        update_interim_results(event_id, event_phase_id)
        return {"status": "success", "message": f"Results updated manually for event_id={event_id}, event_phase_id={event_phase_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Přidání routeru do aplikace
app.include_router(router)
