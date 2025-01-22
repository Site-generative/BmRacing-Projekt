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
    'Content-Type': 'multipart/form-data',
    'X-API-KEY': process.env.REACT_APP_API_KEY,
  },
});

interface ApiResponseRaces {
  data: Races[];
}

const api = {
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
    editEvent: (
      id: number,
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
    
      return postImageInstance.put<CreateEvent>(`/events/update/event/${id}`, formData).catch((error) => {
        console.log('error', error.response.data);
      });
    },
    getCarConfigurations: () => instance.get('/cars/get/car/configurations'),
    getAllDrivers: () => instance.get('/drivers/get/drivers'),
    createDriver: (name: string, surname: string, city: string, street: string, postcode: number, birth_date: string, phone: string, email: string, number: number, web_user: string, web_password: string) => instance.post('/drivers/create/driver', { name, surname, city, street, postcode, birth_date, phone, email, number, web_user, web_password }),
    getAllCars: () => instance.get('/cars/cars'),
    getDriverById: (id: number) => instance.get(`/drivers/get/driver/${id}`),
    createCar: (maker: string, type: string, note: string|null, default_driver_id: number|null) => instance.post('/cars/create/car', { maker, type, note, default_driver_id }),
    eventRegistration: (event_id: number, driver_id: number, car_id: number, car_category_id: number, car_configuration_id: number|null) => instance.post('/registrations/event/register/driver', { event_id, driver_id, car_id, car_category_id, car_configuration_id }),
    getCarCategories: () => instance.get('/car-categories/get/car/categories'),
    createConfiguration: (note: string, power: number, weight: number, power_weight_ratio: number, aero_upgrade: boolean, excessive_modifications: boolean, excessive_chamber: boolean, liquid_leakage: boolean, rear_lights: boolean, safe: boolean, street_legal_tires: boolean, seat_seatbelt_cage: boolean, widebody: boolean, wide_tires: boolean) => instance.post('/cars/create/car/configuration', { note, power, weight, power_weight_ratio, aero_upgrade, excessive_modifications, excessive_chamber, liquid_leakage, rear_lights, safe, street_legal_tires, seat_seatbelt_cage, widebody, wide_tires }),
    getEventResults: (event_id:number, event_phase_id:number) => instance.get(`/laps/get/event/results`, { params: { event_id, event_phase_id } }),
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
      aero_upgrade: boolean, 
      excessive_modifications: boolean, 
      excessive_chamber: boolean, 
      liquid_leakage: boolean, 
      rear_lights: boolean, 
      safe: boolean, 
      street_legal_tires: boolean, 
      seat_seatbelt_cage: boolean, 
      widebody: boolean, 
      wide_tires: boolean) => instance.put(`/cars/update/car-configurations/${id}`, { note, power, weight, power_weight_ratio, aero_upgrade, excessive_modifications, excessive_chamber, liquid_leakage, rear_lights, safe, street_legal_tires, seat_seatbelt_cage, widebody, wide_tires }
    ),
  };

export default api;