import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import TableOfCars from "./TableOfCars";
import { Drivers } from "../utils/commonTypes";
import { toast } from 'react-toastify';

const CreateCarForm = ({ route }: { route: string }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [drivers, setDrivers] = useState<Drivers[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
  };

  const [initialValues] = useState({
    maker: '',
    type: '',
    note: '',
    default_driver_id: '',
  });

  useEffect(() => {
    const fetchPhases = async () => {
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
        setLoadingPhases(false);
      }
    };
  
    fetchPhases();
  }, []);
  
  
  

  const formik = useFormik({
    initialValues: {
      ...initialValues,
      note: initialValues.note === '' ? null : initialValues.note,
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        await api.createCar(values.maker, values.type, values.note, Number(values.default_driver_id));
        
        toast.success('Nové auto bylo úspěšně vytvořeno!');
        navigate(route);
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        setSubmitError(error.response?.data?.message || 'Nepodařilo se vytvořit nové auto.');
      }
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.maker) {
        errors.maker = "Vyplňte výrobce";
      }
      if (!values.type) {
        errors.type = "Vyplňte typ";
      }
      if (values.maker.length > 7) {
        errors.maker = "Maximální délka výrobce je 15 znaků";
      }

      return errors;
    },
  });

  return (
    <div className="flex flex-col lg:flex-row w-full pl-0 lg:pl-10 pt-1 sm:pt-10">
      <div className="flex-grow max-w-screen-sm mx-10">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-center lg:text-left">
            <h1 className="font-body text-5xl font-medium py-2">
              Vytvoření auta
            </h1>
          </div>
          <div className="flex flex-col font-body my-1">
            <label htmlFor="maker" className="text-black">
              Výrobce*
            </label>
            <input
              type="text"
              id="maker"
              name="maker"
              onChange={formik.handleChange}
              value={formik.values.maker}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Mercedes"
            />
            {formik.errors.maker ? (
              <div className="text-red-600">{formik.errors.maker}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="type" className="text-black">
              Typ*
            </label>
            <input
              type="text"
              id="type"
              name="type"
              onChange={formik.handleChange}
              value={formik.values.type}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. AMG GT"
            />
            {formik.errors.type ? (
              <div className="text-red-600">{formik.errors.type}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="note" className="text-black">
              Poznámka
            </label>
            <input
              type="text"
              id="note"
              name="note"
              onChange={formik.handleChange}
              value={formik.values.note ?? ''}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Vynikající jízdní vlastnosti ..."
            />
            {formik.errors.note ? (
              <div className="text-red-600">{formik.errors.note}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 custom-select">
            <label htmlFor="driver" className="text-black">
              Řidič
            </label>
            <select
              name="default_driver_id"
              id="driver"
              onChange={formik.handleChange}
              value={formik.values.default_driver_id}
              className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              disabled={loadingPhases}
            >
              <option value="">-- Vyberte řidiče --</option>
              {loadingPhases ? (
                <option>Načítání ...</option>
              ) : (
                drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} {driver.surname} | {driver.number}
                  </option>
                ))
              )}
            </select>

            {formik.errors.default_driver_id ? (
              <div className="text-red-600">{formik.errors.default_driver_id}</div>
            ) : null}
          </div>

          <div className="flex justify-center font-body my-3">
            <button
              type="submit"
              className="bg-emerald-500 text-white py-1 px-8 hover:px-10 duration-100 rounded-full active:bg-emerald-700"
            >
              Vytvořit
            </button>
          </div>

          {submitError && (
            <div className="text-red-600 text-center mt-4">{submitError}</div>
          )}
        </form>
      </div>
      <div className='p-0 sm:p-4 w-full'>
        <div className='flex lg:flex-row items-center justify-center sm:justify-end py-2'>
            <div className='relative'>
                <input
                    type="text"
                    placeholder="Hledat..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="rounded-full h-max py-2 pl-4 pr-8 border-4 border-red-600 bg-white font-body focus:outline-none"
                />
                <svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <path fill="#f87171" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                </svg>
            </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <TableOfCars searchQuery={searchQuery}/>
        </div>
      </div>
      </div>
  );
};

export default CreateCarForm;
