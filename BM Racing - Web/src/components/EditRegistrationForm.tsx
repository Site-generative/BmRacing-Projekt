import { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { Drivers, Car, CarCategories } from "../utils/commonTypes";
import { toast } from 'react-toastify';
import CreateDriver from "./CreateDriverForm";
import CreateCar from "./CreateCarFormNoTable";
import CreateConfiguration  from "./CreateConfigurationForm";
import EditConfigurationForm from "./EditConfigurationForm";

export interface SimpleRace {
  id: number;
  name: string;
  date: string;
}

const EditRegistrationForm = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [drivers, setDrivers] = useState<Drivers[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Drivers[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [races, setRaces] = useState<SimpleRace[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCarCategories, setLoadingCarCategories] = useState(true);
  const [carCategories, setCarCategories] = useState<CarCategories[]>([]);
  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);
  const [isCreateCarOpen, setIsCreateCarOpen] = useState(false);
  const [isCreateConfigurationOpen, setIsCreateConfigurationOpen] = useState(false);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [carId, setCarId] = useState<number | null>(null);
  const [configurationId, setConfigurationId] = useState<number | null>(null);
  const { id } = useParams<{ id: string }>();
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
  const [isEditConfigurationOpen, setIsEditConfigurationOpen] = useState(false);
  const [power_weight_ratio, setPower_weight_ratio] = useState<number | null>(null);
  const [categoryConfirmed, setCategoryConfirmed] = useState(false);
  const [configurationChanged, setConfigurationChanged] = useState(false);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await api.getRegistrationById(Number(id));

        console.log(response.data);

        formik.setValues({
          event_id: response.data.event_id,
          default_driver_id: response.data.driver_id,
          car_id: response.data.note === null ? '' : response.data.car_id,
          car_category_id: response.data.car_category_id,
          car_configuration_id: response.data.car_configuration_id,
          dnf: response.data.dnf,
          finished: response.data.finished,
        });

        setCurrentDriverId(response.data.driver_id);
      } catch (err) {
        console.error('Error fetching series:', err);
      }
    };

    fetchRegistrations();
    // eslint-disable-next-line
  }, [id]);

  const handleDriverCreated = (id: number) => {
    setDriverId(id);
  };

  const handleCarCreated = (id: number) => {
    setCarId(id);
  };

  const handleConfigurationCreated = (id: number, power_weight_ratio: number) => {
    setConfigurationId(id);
    setPower_weight_ratio(power_weight_ratio);
    setConfigurationChanged(true);
  }

  const handleConfigurationEdited = (id: number, power_weight_ratio: number) => {
    setConfigurationId(id);
    setIsEditConfigurationOpen(false);
    setPower_weight_ratio(power_weight_ratio);
    setConfigurationChanged(true);
  };

  const [initialValues] = useState({
    event_id: '',
    default_driver_id: '',
    car_id: '',
    car_category_id: '',
    car_configuration_id: '',
    dnf: '',
    finished: '',
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await api.getAllDrivers();
  
        const driversData: Drivers[] = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          surname: item.surname,
          number: item.number,
        }));
  
        setDrivers(driversData);
  
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setLoadingDrivers(false);
      }
    };
  
    fetchDrivers();
  }, [driverId]);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const response = await api.getAllRaces();
        
        const racesData: SimpleRace[] = (response.data.data as unknown as SimpleRace[]).map((item) => ({
          id: item.id,
          name: item.name,
          date: item.date,
        }));
  
        setRaces(racesData);
  
      } catch (error) {
        console.error('Error fetching races:', error);
      } finally {
        setLoadingRaces(false);
      }
    };
  
    fetchRaces();
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await api.getAllCars();
        
        const carsData: Car[] = (response.data.data as unknown as Car[]).map((item) => ({
          id: item.id,
          maker: item.maker,
          type: item.type,
          note: item.note,
          default_driver_id: item.default_driver_id,
        }));
  
        setCars(carsData);
  
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoadingCars(false);
      }
    };
  
    fetchCars();
  }, [carId]);

  useEffect(() => {
    const fetchCarCategories = async () => {
      try {
        const response = await api.getCarCategories();
        
        const carCategoriesData: CarCategories[] = (response.data.data as unknown as CarCategories[]).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        }));
  
        setCarCategories(carCategoriesData);
  
      } catch (error) {
        console.error('Error fetching car categories:', error);
      } finally {
        setLoadingCarCategories(false);
      }
    };
  
    fetchCarCategories();
  }, []);

  useEffect(() => {
    if (driverId) {
      formik.setFieldValue('default_driver_id', driverId);
      setIsCreateDriverOpen(false);
    }
    // eslint-disable-next-line
  }, [driverId]);

  useEffect(() => {
    if (carId) {
      formik.setFieldValue('car_id', carId);
      setIsCreateCarOpen(false);
    }
    // eslint-disable-next-line
  }, [carId]);

  useEffect(() => {
    if (configurationId) {
      formik.setFieldValue('car_configuration_id', configurationId);
      setIsCreateConfigurationOpen(false);
    }
    // eslint-disable-next-line
  }, [configurationId]);
  
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      if (configurationChanged && !categoryConfirmed) {
        setSubmitError('Musíte potvrdit, že jste zvolili správnou kategorii auta.');
        return;
      }

      try {
        const carConfigurationId = values.car_configuration_id && values.car_configuration_id !== '0' ? Number(values.car_configuration_id) : null;

        await api.updateRegistration(
          Number(id),
          Number(values.default_driver_id),
          Number(values.car_id),
          Number(values.car_category_id),
          carConfigurationId,
          Boolean(values.dnf),
          Boolean(values.finished),
          Number(values.event_id),
        );
        console.log(Number(id), Number(values.default_driver_id), Number(values.car_id), Number(values.car_category_id), carConfigurationId, Boolean(values.dnf), Boolean(values.finished), Number(values.event_id));
        toast.success('Registrace byla úspěšně upravena!');
        navigate('/home');
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        if (error.response?.status === 400 && error.response?.data?.message === 'No changes were made') {
          setSubmitError('Žádné změny nebyly provedeny.');
        } else {
          setSubmitError(error.response?.data?.message || 'Nepodařilo se upravit registraci.');
        }
      }
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.event_id) {
        errors.event_id = "Vyberte závod";
        console.log(driverId);
      }
      if (!values.default_driver_id) {
        errors.default_driver_id = "Vyberte/Vytvořte řidiče";
      }
      if (!values.car_id) {
        errors.car_id = "Vyberte/Vytvořte auto";
      }
      if (!values.car_category_id) {
        errors.car_category_id = "Vyberte kategorii auta";
      }
      if (!categoryConfirmed && values.car_configuration_id) {
        errors.categoryConfirmed = "Musíte potvrdit, že jste zvolili správnou kategorii auta.";
      }
      if (!categoryConfirmed) {
        setSubmitError('Musíte potvrdit, že jste zvolili správnou kategorii auta.');
        return;
      }

      return errors;
    },
  });

  useEffect(() => {
    const getRegistrationsById = async () => {
      try {
        const response = await api.getRegistrationsByEventIdWithIds(Number(formik.values.event_id));
        const registrations = Array.isArray(response.data) ? response.data : [];
        const registeredDriverIds = registrations.map((registration: any) => registration.driver_id);
  
        const availableDrivers = drivers.filter((driver: any) => 
          !registeredDriverIds.includes(driver.id) || driver.id === currentDriverId
        );
  
        setFilteredDrivers(availableDrivers);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      }
    };
  
    if (formik.values.event_id && drivers.length > 0) {
      getRegistrationsById();
    }
  }, [formik.values.event_id, drivers, currentDriverId]);
  

  return (
    <div className="flex flex-col lg:flex-row w-screen pl-0 lg:pl-10 pt-0 sm:pt-10 items-center justify-center">
      {isCreateDriverOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-1000 sm:z-10 h-max pt-10">
          <div className="relative h-auto max-w-full bg-white rounded-md shadow-lg mt-0 sm:mt-20 p-4">
            <button
              onClick={() => setIsCreateDriverOpen(false)}
              className="absolute top-2 right-2 md:ml-4 md:mt-2 mb-2 md:mb-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
              </svg>
            </button>
            <CreateDriver route='#' onDriverCreated={handleDriverCreated}/>
          </div>
        </div>
      )}
      {isCreateCarOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-10 px-4 sm:px-0">
          <div className="relative h-auto max-w-full bg-white rounded-md shadow-lg p-4">
            <button
              onClick={() => setIsCreateCarOpen(false)}
              className="absolute top-2 right-2 md:ml-4 md:mt-2 mb-2 md:mb-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
              </svg>
            </button>
            <CreateCar route='#' onCarCreated={handleCarCreated}/>
          </div>
        </div>
      )}
      {isCreateConfigurationOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-1000 sm:z-10 h-max md:h-screen">
          <div className="relative h-auto max-w-full bg-white rounded-md shadow-lg p-4">
            <button
              onClick={() => setIsCreateConfigurationOpen(false)}
              className="absolute top-2 right-2 md:ml-4 md:mt-2 mb-2 md:mb-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
              </svg>
            </button>
            <CreateConfiguration route='#' onConfigurationCreated={handleConfigurationCreated}/>
          </div>
        </div>
      )}
      {isEditConfigurationOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-1000 sm:z-10 h-max md:h-screen">
          <div className="relative h-auto max-w-full bg-white rounded-md shadow-lg p-4">
            <button
              onClick={() => setIsEditConfigurationOpen(false)}
              className="absolute top-2 right-2 md:ml-4 md:mt-2 mb-2 md:mb-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
              </svg>
            </button>
            <EditConfigurationForm route='#' id={Number(formik.values.car_configuration_id)} onConfigurationEdited={handleConfigurationEdited}/>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center px-4">
        <form onSubmit={formik.handleSubmit} className="flex flex-col text-center sm:text-left">
          <div className="w-full text-center">
            <h1 className="font-body text-2xl sm:text-5xl font-medium py-2">
              Upravení registrace <br/> do závodu
            </h1>
          </div>

          <div className="flex flex-col font-body my-1 custom-select px-20 sm:px-0">
            <label htmlFor="event_id" className="text-black">
              Závod*
            </label>
            <select
              name="event_id"
              id="event_id"
              onChange={formik.handleChange}
              value={formik.values.event_id}
              className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min sm:w-full"
              disabled={loadingRaces}
            >
              <option value="">-- Vyberte závod --</option>
              {loadingRaces ? (
                <option>Načítání ...</option>
              ) : (
                races.map((race) => (
                  <option key={race.id} value={race.id}>
                    {race.name} | {new Date(race.date).toLocaleDateString('cs-CZ')}
                  </option>
                ))
              )}
            </select>

            {formik.errors.event_id ? (
              <div className="text-red-600">{formik.errors.event_id}</div>
            ) : null}
          </div>
          
          <div className="flex flex-col font-body my-1 custom-select mt-4 sm:mt-1 ">
            <label htmlFor="driver" className="text-black">
              Řidič*
            </label>
            <div className="flex items-center flex-col sm:flex-row">
              <select
                name="default_driver_id"
                id="driver"
                onChange={formik.handleChange}
                value={formik.values.default_driver_id}
                className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min"
                disabled={loadingDrivers}
              >
                <option value="">-- Vyberte řidiče --</option>
                {loadingDrivers ? (
                  <option>Načítání ...</option>
                ) : (
                  filteredDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} {driver.surname} | {driver.number}
                    </option>
                  ))
                )}
              </select>
              <div className="flex items-center mx-2 w-full my-4 sm:my-0">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-2 flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 text-sm font-light">
                  Nebo
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                className="bg-red-600 text-white py-1 px-4 rounded-full whitespace-nowrap hover:bg-red-700 active:bg-red-800"
                onClick={() => setIsCreateDriverOpen(true)}
              >
                Vytvořit řidiče
              </button>
            </div>
            {formik.errors.default_driver_id ? (
              <div className="text-red-600">{formik.errors.default_driver_id}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 custom-select">
            <label htmlFor="car_id" className="text-black">
              Auto*
            </label>
            <div className="flex items-center flex-col sm:flex-row">
            <select
              name="car_id"
              id="car_id"
              onChange={formik.handleChange}
              value={formik.values.car_id}
              className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min"
              disabled={loadingCars}
            >
              <option value="">-- Vyberte auto --</option>
              {loadingCars ? (
                <option>Načítání ...</option>
              ) : (
                cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.maker} {car.type} | {drivers.find((driver) => driver.id === car.default_driver_id)?.name} {drivers.find((driver) => driver.id === car.default_driver_id)?.surname}
                  </option>
                ))
              )}
            </select>
              <div className="flex items-center mx-2 w-full my-4 sm:my-0">
                <div className="flex-grow border-t border-gray-300"></div>
                  <span className="mx-2 flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 text-sm font-light">
                    Nebo
                  </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                className="bg-red-600 text-white py-1 px-4 rounded-full whitespace-nowrap hover:bg-red-700 active:bg-red-800"
                onClick={() => setIsCreateCarOpen(true)}
              >
                Vytvořit auto
              </button>
            </div>
            {formik.errors.car_id ? (
              <div className="text-red-600">{formik.errors.car_id}</div>
            ) : null}
          </div>

            <div className="flex flex-col font-body my-1 mt-4 sm:mt-1 custom-select items-center sm:items-start">
              <label htmlFor="car_category_id" className="text-black">
                Kategorie auta*
              </label>
              <select
                name="car_category_id"
                id="car_category_id"
                onChange={formik.handleChange}
                value={formik.values.car_category_id}
                className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min sm:w-full"
                disabled={loadingCarCategories}
              >
                <option value="">-- Vyberte kategorii --</option>
                {loadingCarCategories ? (
                  <option>Načítání ...</option>
                ) : (
                  carCategories.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name} | {car.description}
                    </option>
                  ))
                )}
              </select>

              {formik.errors.car_category_id ? (
              <div className="text-red-600">{formik.errors.car_category_id}</div>
            ) : null}
            </div>

            <div className="flex flex-col font-body my-1 custom-select mt-4 sm:mt-1 ">
            <label htmlFor="car_configuration_id" className="text-black">
              Konfigurace auta
            </label>
            <div className="flex items-center flex-col sm:flex-row">
              <select
                name="car_configuration_id"
                id="car_configuration_id"
                onChange={formik.handleChange}
                value={formik.values.car_configuration_id}
                className="custom-select-register rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white mb-4 sm:mb-0"
                disabled
              >
                <option value="">
                  {formik.values.car_configuration_id ? 'Konfigurace byla vytvořena' : 'Nebyla vytvořena konfigurace'}
                </option>
              </select>
              <button
                type="button"
                className="bg-red-600 text-white py-1 px-4 rounded-full whitespace-nowrap ml-2 hover:bg-red-700 active:bg-red-800"
                onClick={() => setIsCreateConfigurationOpen(true)}
              >
                {formik.values.car_configuration_id ? 'Vytvořit novou konfiguraci' : 'Vytvořit konfiguraci'}
              </button>
              {formik.values.car_configuration_id && (
                <button
                  type="button"
                  className="bg-blue-600 text-white py-1 px-4 rounded-full whitespace-nowrap ml-2 mt-2 sm:mt-0 hover:bg-blue-700 active:bg-blue-800"
                  onClick={() => setIsEditConfigurationOpen(true)}
                >
                  Upravit stávající
                </button>
              )}
            </div>
            <label htmlFor="car_configuration_id" className="text-black text-md font-light">
                {formik.values.car_configuration_id && power_weight_ratio !== null ? 'Poměr výkonu a hmotnosti: ' + power_weight_ratio : ''}
            </label>

            {formik.errors.car_configuration_id ? (
              <div className="text-red-600">{formik.errors.car_configuration_id}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 mt-4 sm:mt-1 custom-select items-center sm:items-start">
              <label htmlFor="dnf" className="text-black">
                Diskvalifikován?*
              </label>
              <select
                name="dnf"
                id="dnf"
                onChange={(e) => formik.setFieldValue('dnf', e.target.value === 'true')}
                value={formik.values.dnf ? 'true' : 'false'}
                className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min sm:w-full"
              >
                <option value='true'>ANO</option>
                <option value='false'>NE</option>
              </select>

              {formik.errors.dnf ? (
              <div className="text-red-600">{formik.errors.dnf}</div>
            ) : null}
            </div>

            <div className="flex flex-col font-body my-1 mt-4 sm:mt-1 custom-select items-center sm:items-start">
              <label htmlFor="finished" className="text-black">
                Dokončil závod?*
              </label>
              <select
                name="finished"
                id="finished"
                onChange={(e) => formik.setFieldValue('finished', e.target.value === 'true')}
                value={formik.values.finished ? 'true' : 'false'}
                className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white w-min sm:w-full"
              >
                <option value='true'>ANO</option>
                <option value='false'>NE</option>
              </select>

              {formik.errors.finished ? (
              <div className="text-red-600">{formik.errors.finished}</div>
            ) : null}
            </div>

          {configurationChanged && (
              <div className="flex items-center justify-center my-3 font-body font-light">
                  <input
                      type="checkbox"
                      id="categoryConfirmed"
                      name="categoryConfirmed"
                      checked={categoryConfirmed}
                      onChange={(e) => setCategoryConfirmed(e.target.checked)}
                      className="mr-2"
                  />
                  <label htmlFor="categoryConfirmed" className="text-black">
                      Potvrzuji, že jsem zvolil správnou kategorii auta
                  </label>
              </div>
          )}

          <div className="flex justify-center font-body my-6">
            <button
              type="submit"
              className="bg-emerald-500 text-white py-1 px-8 hover:px-10 duration-100 rounded-full active:bg-emerald-700"
            >
              Upravit
            </button>
          </div>

          {submitError && (
            <div className="text-red-600 text-center mt-4">{submitError}</div>
          )}
        </form>
      </div>
      </div>
  );
};

export default EditRegistrationForm;
