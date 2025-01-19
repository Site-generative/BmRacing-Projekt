from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="Admin@123456789")
class UserAuthenticate(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="Admin@123456789")
class AppUserAuthenticate(BaseModel):
    web_user: str = Field(..., example="dominik")
    web_password: str = Field(..., example="vins")
class DriverRegistration(BaseModel):
    name: str = Field(..., example="Dominik")
    surname: str = Field(..., example="Vinš")
    city: str = Field(..., example="Ústí nad Labem")
    street: str = Field(..., example="Valtířov")
    postcode: int = Field(..., example=40002)
    birth_date: datetime = Field(..., example="2000-01-01")
    phone: str = Field(..., example="777654852")
    email: str = Field(..., example="domik.mbvins@seznam.cz")
    number: int = Field(..., example=31)
    web_user: str = Field(..., example="dominik")
    web_password: str = Field(..., example="vins")
class CreateSeries(BaseModel):
    name: str = Field(..., example="Czech Cup")
    year: str = Field(..., example="2024")
class CreateEventPhase(BaseModel):
    phase_name: str = Field(..., example="Qualification")
    result_type: Optional[str] = Field(..., example="MIN")
class CreateCar(BaseModel):
    maker: str = Field(..., example="Subaru")
    type: str = Field(..., example="Impreza")
    note: Optional[str] = Field(..., example="car")
    default_driver_id: Optional[int] = Field(..., example=31)
class CreateCarConfiguration(BaseModel):
    note: Optional[str] = Field(..., example="car")
    power: int = Field(..., example=200)
    weight: int = Field(..., example=1200)
    power_weight_ratio: float = Field(..., example=0.16)
    aero_upgrade: bool = Field(..., example=True)
    excessive_modifications: bool = Field(..., example=False)
    excessive_chamber: bool = Field(..., example=False)
    liquid_leakage: bool = Field(..., example=False)
    rear_lights: bool = Field(..., example=True)
    safe: bool = Field(..., example=True)
    street_legal_tires: bool = Field(..., example=True)
    seat_seatbelt_cage: bool = Field(..., example=True)
    widebody: bool = Field(..., example=False)
    wide_tires: bool = Field(..., example=False)
class CreateCarCategory(BaseModel):
    name: str = Field(..., example="A1")
    description: Optional[str] = Field(..., example="Rally cars")
class CreateEvent(BaseModel):
    name: str = Field(..., example="Brno GP")
    number_of_laps: int = Field(..., example=3)
    date: str = Field(..., example="2024-08-01T08:30:00.000")
    location: str = Field(..., example="Masarykův okruh")
    start_coordinates: str = Field(..., example="49.1983,16.6078;49.1783,16.4078")
    end_coordinates: str = Field(..., example="49.1983,16.6078;49.1783,16.4078")
    event_phase_id: int = Field(..., example=1)
    series_id: int = Field(..., example=1)
class PostLapData(BaseModel):
    event_id: int = Field(..., example=1)
    web_user: str = Field(..., example="dominik")
    laptime: str = Field(..., example="00:01:30.000")
    event_phase_id: int = Field(..., example=1)
class RegisterDriverToEvent(BaseModel):
    driver_id: int = Field(..., example=1)
    car_id: int = Field(..., example=1)
    car_category_id: int = Field(..., example=1)
    car_configuration_id: Optional[int] = Field(..., example=None)
    event_id: int = Field(..., example=1)
class LapData(BaseModel):
    racer_id: int = Field(..., example=1)
    time: int = Field(..., example=45)
    laps: int = Field(..., example=3)
    speed: int = Field(..., example=120)

class RaceEvent(BaseModel):
    name: str = Field(..., example="Brno GP")
    description: str = Field(..., example="Nejlepší závod roku")
    date_time: str = Field(..., example="2024-08-01T15:00:00") # ISO 8601 (Rok, Měsíc, Den, Hodiny, Minuty, Sekundy, Milisekundy)
    address: str = Field(..., example="Masarykův okruh")
    laps: int = Field(..., example=3)
    is_open: bool = Field(..., example=True)
    start_coordinates: str = Field(..., example="49.1983,16.6078;49.1783,16.4078")
    end_coordinates: str = Field(..., example="49.1983,16.6078;49.1783,16.4078")

class DriverRegister(BaseModel):
    name: str = Field(..., example="John")
    surname: str = Field(..., example="Doe")
    city: str = Field(..., example="Brno")
    street: str = Field(..., example="Masarykova")
    postcode: int = Field(..., example=60200)
    birth_date: str = Field(..., example="2000-01-01")
    phone: str = Field(..., example="123456789")
    email: str = Field(..., example="example@ex.com")
    number: int = Field(..., example=31)
    web_user: str = Field(..., example="user")
    web_password: str = Field(..., example="password")
class DriverUpdate(BaseModel):
    name: str = Field(..., example="John")
    surname: str = Field(..., example="Doe")
    city: str = Field(..., example="Brno")
    street: str = Field(..., example="Masarykova")
    postcode: str = Field(..., example="60200")
    birth_date: str = Field(..., example="2000-01-01")
    phone: str = Field(..., example="123456789")
    email: str = Field(..., example="johndoe@gmail.com")
    number: str = Field(..., example="31")
    racebox_id: Optional[int] = Field(..., example=0)
class RacerResult(BaseModel):
    driver_id: int
    event_id: int
    time: str
    avg_speed: str
    max_speed: str

# Nové
class CarCategory(BaseModel):
    name: str
    description: Optional[str] = None
class EventPhase(BaseModel):
    phase_name: str
    result_type: str
class Event(BaseModel):
    name: str
    number_of_laps: int
    date: str
    location: str
    start_coordinates: Optional[str] = None
    end_coordinates: Optional[str] = None
    image: Optional[str] = None
    event_phase_id: int
    series_id: int
class Driver(BaseModel):
    name: str
    surname: str
    city: str
    street: str
    postcode: str
    birth_date: str
    phone: str
    email: str
    number: int
    web_user: str
    web_password: str
    racebox_id: int
class Car(BaseModel):
    maker: str
    type: str
    note: Optional[str] = None
    default_driver_id: int
class CarConfiguration(BaseModel):
    note: Optional[str] = None
    power: int
    weight: int
    power_weight_ratio: float
    aero_upgrade: bool
    excessive_modifications: bool
    excessive_chamber: bool
    liquid_leakage: bool
    rear_lights: bool
    safe: bool
    street_legal_tires: bool
    seat_seatbelt_cage: bool
    widebody: bool
    wide_tires: bool
class EventRegistration(BaseModel):
    driver_id: int
    car_id: int
    car_category_id: int
    car_configuration_id: int
    event_id: int
class Series(BaseModel):
    name: str
    year: int
class EventResult(BaseModel):
    event_registration_id: int
    event_phase_id: int
    total_time: str
    points: int
    position: int
class EventLap(BaseModel):
    event_registration_id: int
    laptime: str
    event_phase_id: int
class UpdateEventPhase(BaseModel):
    id: int = Field(..., example=3)
    phase_id: int = Field(..., example=4)
class EventDriverResults(BaseModel):
    web_user: str = Field(..., example="dominik")
    event_id: int = Field(..., example=13)
    event_phase_id: int = Field(..., example=1)
class UpdateSerie(BaseModel):
    name: str = Field(..., example="Czech Cup")
    year: str = Field(..., example=2024)
class DriverEventState(BaseModel):
    event_id: int
    dnf: bool
    finished: bool