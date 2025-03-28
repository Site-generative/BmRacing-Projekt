export interface Races {
    id: number;
    name: string;
    number_of_laps: number;
    date: Date;
    location: string;
    start_coordinates: string;
    end_coordinates: string;
    image: string;
    phase_name: string;
    series_name: string;
}

export interface Login {
    username: string;
    password: string;
}

export interface Phases {
    id: number;
    name: string;
    result_type: string | null;
}

export interface Series {
    id: number;
    name: string;
    year: number;
}

export interface CreateEvent {
    name: string;
    number_of_laps: number;
    date: string;
    location: string;
    start_coordinates: string;
    end_coordinates: string;
    image: File | null;
    event_phase_id: number;
    series_id: number;
    sameStartFinish?: boolean;
}

export interface getEventDetails {
    id: number;
    name: string;
    number_of_laps: number;
    date: string;
    location: string;
    start_coordinates: string;
    end_coordinates: string;
    image: string;
    event_phase_id: number;
    series_id: number;
}

export interface Configurations {
    id: number;
    note: string;
    power: number;
    weight: number;
    power_weight_ratio: string;
    aero_upgrade: number;
    excessive_modifications: number;
    excessive_chamber: number;
    liquid_leakage: number;
    rear_lights: number;
    safe: number;
    street_legal_tires: number;
    seat_seatbelt_cage: number;
    widebody: number;
    wide_tires: number;
}

export interface Drivers {
    id: number;
    name: string;
    surname: string;
    city: string;
    street: string;
    postcode: string;
    birth_date: string;
    phone: string;
    email: string;
    number: number;
    racebox_id?: number;
}

export interface CreateDriver {
    name: string;
    surname: string;
    city: string;
    street: string;
    postcode: number;
    birth_date: string;
    phone: string;
    email: string;
    number: number;
    web_user: string;
    web_password: string;
}

export interface Car {
    id: number;
    maker: string;
    type: string;
    note?: string;
    default_driver_id?: number;
}

export interface CreateCar {
    maker: string;
    type: string;
    note?: string | null;
    default_driver_id?: number | null;
}

export interface EventRegistration {
    event_id: number;
    driver_id: number;
    car_id: number;
    car_category_id: number;
    car_configuration_id: number |null;
}

export interface CarCategories {
    id: number;
    name: string;
    description: string;
}

export interface CreateConfiguration {
    note: string;
    power: number;
    weight: number;
    power_weight_ratio: number;
    aero_upgrade: boolean;
    excessive_modifications: boolean;
    excessive_chamber: boolean;
    liquid_leakage: boolean;
    rear_lights: boolean;
    safe: boolean;
    street_legal_tires: boolean;
    seat_seatbelt_cage: boolean;
    widebody: boolean;
    wide_tires: boolean;
}

export interface EventTrainingAndQualificationResults {
    position: number;
    points: number;
    number: number;
    name: string;
    surname: string;
    car: string;
    car_class: string;
    best_lap: string;
}

export interface Registrations {
    event_registration_id: number;
    driver_name: string;
    driver_surname: string;
    car_maker: string;
    car_type: string;
    car_configuration_id: number | null;
    power_weight_ratio: number;
    category_name: string;
    excessive_modifications: number;
    configuration_status: string;
}

export interface SeriesRaceResults {
    [raceName: string]: number;
  }
  
  export interface SeriesDriver {
    driver_id: number;
    driver_name: string;
    race_number: string;
    car: string;
    category_id: number;
    category: string;
    races: SeriesRaceResults;
    total_points: number;
  }
  
  export interface SeriesCategory {
    category: string;
    drivers: SeriesDriver[];
  }
  
  export type SeriesDriverResults = SeriesCategory[];

  export interface LapTimeRace {
    lap_times: string[];
  }
  
  export interface DriverResultRace extends LapTimeRace {
    position: number;
    points: number;
    start_number: number;
    dnf: boolean;
    finished: boolean;
    driver_name: string;
    car: string;
    total_time: string;
  }
  
  export interface RaceCategory {
    category_id: number;
    category_name: string;
    results: DriverResultRace[];
  }
  
  export type EventRaceResults = RaceCategory[];