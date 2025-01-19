from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class WebRegisterResponseModel(BaseModel):
    message: str
class WebLoginResponseModel(BaseModel):
    message: str
class AppLoginResponseModel(BaseModel):
    message: str
class PostResponseModel(BaseModel):
    status: str
    message: str
class PostResponseReturnIdModel(BaseModel):
    status: str
    message: str
    id: int
class PutResponseModel(BaseModel):
    status: str
    message: str
class DeleteResponseModel(BaseModel):
    status: str
    message: str
class RaceResponseModel(BaseModel):
    id: int
    name: str
    number_of_laps: int
    date: Optional[datetime]  # Může být buď datetime nebo None
    location: str
    start_coordinates: Optional[str]  # Assuming it's a string, adjust if needed
    end_coordinates: Optional[str]  # Assuming it's a string, adjust if needed
    image: Optional[str]  # URL nebo None
    phase_name: str
    series_name: str
class DriverRacesResponseModel(BaseModel):
    id: int
    name: str
    number_of_laps: int
    date: Optional[datetime]  # Může být buď datetime nebo None
    location: str
    event_phase_id: int
class RaceDetailResponseModel(BaseModel):
    id: int
    name: str
    number_of_laps: int
    date: str
    location: str
    start_coordinates: str
    end_coordinates: str
    image: str
    event_phase_id: int
    series_id: int
class CarResponseModel(BaseModel):
    id: int
    maker: str
    type: str
    note: str
    default_driver_id: int
class CarModel(BaseModel):
    maker: str
    type: str
    note: str
    default_driver_id: int
class DriverResponseModel(BaseModel):
    id: int
    name: str
    surname: str
    city: str
    street: str
    postcode: str
    birth_date: str
    phone: str
    email: str
    number: str
    racebox_id: Optional[int]
class RaceboxResponseModel(BaseModel):
    id: int
    device_id: str
class EventResponseModel(BaseModel):
    id: int
    name: str
    number_of_laps: int
    date: str
    location: str
    start_coordinates: str
    end_coordinates: str
    image: str
    event_phase_id: int
    series_id: int
class CarCategoryResponseModel(BaseModel):
    id: int
    name: str
    description: str
class CarConfigurationResponseModel(BaseModel):
    id: int
    note: str
    power: int
    weight: int
    power_weight_ratio: float
    aero_upgrade: int
    excessive_modifications: int
    excessive_chamber: int
    liquid_leakage: int
    rear_lights: int
    safe: int
    street_legal_tires: int
    seat_seatbelt_cage: int
    widebody: int
    wide_tires: int
class CarConfiguration(BaseModel):
    note: str
    power: int
    weight: int
    power_weight_ratio: float
    aero_upgrade: int
    excessive_modifications: int
    excessive_chamber: int
    liquid_leakage: int
    rear_lights: int
    safe: int
    street_legal_tires: int
    seat_seatbelt_cage: int
    widebody: int
    wide_tires: int
class SeriesResponseModel(BaseModel):
    id: int
    name: str
    description: str
class EventPhaseResponseModel(BaseModel):
    id: int
    phase_name: str
    result_type: str
class EventRegistrationResponseModel(BaseModel):
    id: int
    user_id: int
    event_id: int
class PointsDefinitionResponseModel(BaseModel):
    id: int
    position: int
    points: int
class PointsDefinition(BaseModel):
    position: int
    points: int
class UserResponseModel(BaseModel):
    id: int
    username: str
    password: str
class User(BaseModel):
    username: str
    password: str
class PhaseNameResponseModel(BaseModel):
    name: str
class EventResultResponseModel(BaseModel):
    car_category_id: int
    category_name: str
    result_id: int
    event_phase_id: int
    event_registration_id: int
    total_time: str
    points: int
    position: int
    dnf: int
    driver_name: str
    driver_surname: str
    driver_email: str
    number: int
    phase_name: str
class EventDriverEventResultsResponseModel(BaseModel):
    lap: int
    time: str
class EventRegistrationsResponseModel(BaseModel):
    event_registration_id: int
    driver_name: str
    driver_surname: str
    car_maker: str
    car_type: str
    car_configuration_id: Optional[int]
    configuration_status: str
class EventRegistrationDetailResponseModel(BaseModel):
    id: int
    driver_id: int
    car_id: int
    car_category_id: int
    car_configuration_id: Optional[int]
    event_id: int
class EventRegistrationFillData(BaseModel):
    driver_id: int
    car_id: int
    car_category_id: int
    car_configuration_id: Optional[int]
    event_id: int
    dnf: bool
    finished: bool
class GetAllEventRegistrations(BaseModel):
    id: int
    driver_id: int
    car_id: int
    car_category_id: int
    car_configuration_id: Optional[int]
    event_id: int
    dnf: bool
    finished: bool
class GetAllEventRegistrationsWithIds(BaseModel):
    id: int
    driver_id: int
    car_id: int
    car_category_id: int
    car_configuration_id: Optional[int]
    event_id: int
    dnf: bool
    finished: bool
class EventAverageRacePhaseResponseModel(BaseModel):
    total_racers: int
    average_time: str
    fastest_time: str
    slowest_time: str
class EventResultCategoryRacePhaseResponseModel(BaseModel):
    car_category_id: int
    category_name: str
    total_racers: int
    average_time: str
    fastest_time: str
    slowest_time: str
    total_dnf: int
class FlagCreate(BaseModel):
    name: str
    note: Optional[str]
class FlagsResponseModel(BaseModel):
    id: int
    name: str
    note: Optional[str]