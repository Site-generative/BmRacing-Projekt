import axios from 'axios';
import { Races, Login, CreateEvent } from '../utils/commonTypes';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': process.env.REACT_APP_API_KEY,
  },
});

const postImageInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'multiplatform/form-data',
    'X-API-KEY': process.env.REACT_APP_API_KEY,
  },
});

interface ApiResponseRaces {
  data: Races[];
}

const api = {
    editEvent: (
      id: number,
      name: string,
      number_of_laps: number,
      date: string,
      location: string,
      start_coordinates: string,
      end_coordinates: string,
      event_phase_id: number,
      series_id: number) => instance.put(`/events/update/event/${id}`, { name, number_of_laps, date, location, start_coordinates, end_coordinates, event_phase_id, series_id }
    ),
    getAllRaces: () => instance.get<ApiResponseRaces>('/events/get/get-all-races'),
    login: (params: Login) => instance.post<Login>('/auth/login', params),
    getPhaseName: (id: number) => instance.get(`/phases/get/phase_name/${id}`),
    getSeriesById: (id: number) => instance.get(`/series/series/${id}`),
    getPhases: () => instance.get('/phases/get/phases'),
    getSeries: () => instance.get('/series/series'),
    createEvent: (
      name: string,
      number_of_laps: number,
      date: string,
      location: string,
      start_coordinates: string,
      end_coordinates: string,
      image: File | null,
      event_phase_id: number,
      series_id: number
    ) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('date', date);
      formData.append('location', location);
      formData.append('number_of_laps', number_of_laps.toString());
      if (image) {
        formData.append('image', image);
      }
      formData.append('start_coordinates', start_coordinates);
      formData.append('end_coordinates', end_coordinates);
      formData.append('event_phase_id', event_phase_id.toString());
      formData.append('series_id', series_id.toString());
    
      return postImageInstance.post<CreateEvent>('/events/create/event', formData).catch((error) => {
        console.log('error', error.response.data);
      });
    },
    createSeries: (name: string, year: string) => instance.post('/series/create/series', { name, year }),
    getEventDetails: (id: number) => instance.get(`/events/get/event/detail/${id}/`),
    deleteEvent: (id: number) => instance.delete(`/events/delete/event/${id}`),
    getCarConfigurations: () => instance.get('/cars/get/car/configurations'),
    getAllDrivers: () => instance.get('/drivers/get/drivers'),
    createDriver: (name: string, surname: string, city: string, street: string, postcode: number, birth_date: string, phone: string, email: string, number: number, web_user: string, web_password: string) => instance.post('/drivers/create/driver', { name, surname, city, street, postcode, birth_date, phone, email, number, web_user, web_password }),
    getAllCars: () => instance.get('/cars/cars'),
    getDriverById: (id: number) => instance.get(`/drivers/get/driver/${id}`),
    createCar: (maker: string, type: string, note: string|null, default_driver_id: number|null) => instance.post('/cars/create/car', { maker, type, note, default_driver_id }),
    eventRegistration: (event_id: number, driver_id: number, car_id: number, car_category_id: number, car_configuration_id: number|null) => instance.post('/registrations/event/register/driver', { event_id, driver_id, car_id, car_category_id, car_configuration_id }),
    getCarCategories: () => instance.get('/car-categories/get/car/categories'),
    createConfiguration: (note: string, power: number, weight: number, power_weight_ratio: number, aero_upgrade: number, excessive_modifications: boolean, excessive_chamber: number, liquid_leakage: boolean, rear_lights: boolean, safe: boolean, street_legal_tires: number, seat: number, seatbelt: number, widebody: number, wide_tires: number) => instance.post('/cars/create/car/configuration', { note, power, weight, power_weight_ratio, aero_upgrade, excessive_modifications, excessive_chamber, liquid_leakage, rear_lights, safe, street_legal_tires, seat, seatbelt, widebody, wide_tires }),
    deleteSeries: (id: number) => instance.delete(`/series/delete/series/${id}`),
    updateDriver: (
      id: number, 
      name: string, 
      surname: string, 
      city: string, 
      street: string, 
      postcode: string, 
      birth_date: string, 
      phone: string, 
      email: string, 
      number: string,
      racebox_id: null) => instance.put(`/drivers/update/drivers/${id}`, { name, surname, city, street, postcode, birth_date, phone, email, number, racebox_id}
    ),
    getCarById: (id: number) => instance.get(`/cars/get/cars/${id}`),
    updateCar: (
      id: number, 
      maker: string, 
      type: string, 
      note: string|null, 
      default_driver_id: number|null) => instance.put(`/cars/update/cars/${id}`, { id, maker, type, note, default_driver_id }
    ),
    updateSeries: (id: number, name: string, year: string) => instance.put(`/series/update/series/${id}`, { id, name, year }),
    getRegistrationsByEventId: (event_id: number) => instance.get(`/registrations/get/event-registrations/${event_id}`),
    getRegistrationsByEventIdWithIds: (event_id: number) => instance.get(`/registrations/get/event-registrations/return_ids/${event_id}`),
    getRegistrationById: (event_registration_id: number) => instance.get(`/registrations/get/event-registration/${event_registration_id}`),
    updateRegistration: (
      event_registration_id: number,
      driver_id: number,
      car_id: number, 
      car_category_id: number, 
      car_configuration_id: number|null,
      dnf: boolean,
      finished: boolean,
      event_id: number) => instance.put(`/registrations/update/event-registrations/${event_registration_id}`, { driver_id, car_id, car_category_id, car_configuration_id, event_id, dnf, finished }
    ),
    getConfigurationById: (id: number) => instance.get(`/cars/get/car/configuration/${id}`),
    getAllRegistrations: () => instance.get('/registrations/get/registrations'),
    updateConfiguration: (
      id: number,
      note: string, 
      power: number, 
      weight: number, 
      power_weight_ratio: number, 
      aero_upgrade: number, 
      excessive_modifications: boolean, 
      excessive_chamber: number, 
      liquid_leakage: boolean, 
      rear_lights: boolean, 
      safe: boolean, 
      street_legal_tires: number, 
      seat: number, 
      seatbelt: number, 
      widebody: number, 
      wide_tires: number) => instance.put(`/cars/update/car-configurations/${id}`, { note, power, weight, power_weight_ratio, aero_upgrade, excessive_modifications, excessive_chamber, liquid_leakage, rear_lights, safe, street_legal_tires, seat, seatbelt, widebody, wide_tires }
    ),
    deleteCar: (car_id: number) => instance.delete(`/cars/delete/car/${car_id}`),
    deleteDriver: (driver_id: number) => instance.delete(`/drivers/delete/driver/${driver_id}`),
    deleteRegistration: (event_registration_id: number) => instance.delete(`/registrations/delete/event-registration/${event_registration_id}`),
    getAllSeriesRankings: (series_id: number) => instance.get(`/results/get/series/all-rankings`, { params: { series_id } }),
    updateDriverPassword: (driver_id: number, password: string) => instance.put(`/auth/change/driver/password/?driver_id=${driver_id}&password=${encodeURIComponent(password)}`),
    getSeriesResults: (series_id: number) => instance.get(`/results/get/series/detailed/driver-rankings`, { params: { series_id } }),
    getEventResults: (event_id:number, event_phase_id:number) => instance.get(`/results/get/training/qualification/results`, { params: { event_id, event_phase_id } }),
    getEventRaceResults: (event_id: number, phase_id: number) => instance.get(`/results/get/phase/race/results/${event_id}/${phase_id}`, { params: { event_id, phase_id } }),
  };

export default api;