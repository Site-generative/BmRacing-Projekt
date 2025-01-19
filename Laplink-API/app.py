from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import login, events, drivers, series, phases, cars, laps, registrations, car_categories, raceboxes, points_definitions, statistics, flags
from concurrent.futures import ThreadPoolExecutor

app = FastAPI(
    title="Laplink API",
    description="API pro aplikaci Laplink",
    version="1.0",
    docs_url="/",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["PUT", "POST", "GET", "DELETE"],
    allow_headers=["*"],
)
executor = ThreadPoolExecutor(max_workers=10)
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(login.router, prefix="/auth", tags=["Authentication"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
app.include_router(series.router, prefix="/series", tags=["Series"])
app.include_router(phases.router, prefix="/phases", tags=["Phases"])
app.include_router(cars.router, prefix="/cars", tags=["Cars"])
app.include_router(laps.router, prefix="/laps", tags=["Laps"])
app.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
app.include_router(car_categories.router, prefix="/car-categories", tags=["Car Categories"])
app.include_router(raceboxes.router, prefix="/raceboxes", tags=["Raceboxes"])
app.include_router(points_definitions.router, prefix="/points-definitions", tags=["Points Definitions"])
app.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
app.include_router(flags.router, prefix="/flags", tags=["Flags"])