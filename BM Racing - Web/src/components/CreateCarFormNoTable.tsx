import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Drivers } from "../utils/commonTypes";
import { toast } from 'react-toastify';

const CreateCarFormNoTable = ({ route, onCarCreated }: { route: string, onCarCreated: (id: number) => void }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [drivers, setDrivers] = useState<Drivers[]>([]);

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
        const response = await api.createCar(values.maker, values.type, values.note, Number(values.default_driver_id));

        onCarCreated(response.data.car_id);

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

      return errors;
    },
  });

  return (
    <div className="flex flex-col lg:flex-row w-full pl-0 lg:pl-10 pt-1 sm:pt-10 items-center">
      <div className="flex-grow max-w-screen-sm pr-0 sm:pr-10">
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
      </div>
  );
};

export default CreateCarFormNoTable;
