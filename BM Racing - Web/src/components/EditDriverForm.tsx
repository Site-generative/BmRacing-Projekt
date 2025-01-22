import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';

const EditDriverForm = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await api.getDriverById(Number(id));
        formik.setValues({
          name: response.data.data.name,
          surname: response.data.data.surname,
          city: response.data.data.city,
          street: response.data.data.street,
          postcode: response.data.data.postcode,
          birth_date: response.data.data.birth_date,
          phone: response.data.data.phone,
          email: response.data.data.email,
          number: response.data.data.number.toString(),
        });
      } catch (err) {
        console.error('Error fetching series:', err);
      }
    };

    fetchDrivers();
    // eslint-disable-next-line
  }, []);

  const formik = useFormik({
    initialValues: {      
      name: '',
      surname: '',
      city: '',
      street: '',
      postcode: '',
      birth_date: '',
      phone: '',
      email: '',
      number: '',
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        await api.updateDriver(Number(id), values.name, values.surname, values.city, values.street, values.postcode, values.birth_date, values.phone, values.email, values.number.toString(), null);
        
        toast.success('Řidič byl úspěšně upraven!');
        navigate('/table-drivers');
      } catch (error: any) {
        console.error('API Error:', error.response);
        setSubmitError(error.response?.data?.message || 'Nepodařilo se upravit řidiče.');
      }
      
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.name) {
        errors.name = "Vyplňte jméno";
      }
      if (!values.surname) {
        errors.surname = "Vyplňte příjmení";
      }
      if (!values.city) {
        errors.city = "Vyplňte město";
      }
      if (!values.street) {
        errors.street = "Vyplňte ulici";
      }
      if (!values.postcode) {
        errors.postcode = "Vyplňte PSČ";
      } else if (values.postcode.length > 5) {
        errors.postcode = "PSČ může mít maximálně 5 znaků bez mezer";
      }
      if (!values.birth_date) {
        errors.birth_date = "Vyplňte datum narození";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birth_date)) {
        errors.birth_date = 'Datum musí být v platném formátu';
      }
      if (!values.phone) {
        errors.phone = "Vyplňte telefonní číslo";
      } else if (!/^\d{9}$/.test(values.phone)) {
        errors.phone = 'Telefonní číslo musí mít 9 číslic bez mezer';
      }
      if (!values.email) {
        errors.email = "Vyplňte e-mail";
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = 'E-mail musí být v platném formátu';
      }
      if (!values.number) {
        errors.number = "Vyplňte číslo řidiče";
      }
      return errors;
    },
  });

  return (
    <div className="flex w-screen px-0 lg:px-10 justify-center pt-2">
      <div className="">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-center lg:text-left">
            <h1 className="font-body text-5xl font-medium py-2">
              Úprava řidiče
            </h1>
          </div>
          <div className="flex flex-col font-body my-1">
            <label htmlFor="name" className="text-black">
              Jméno
            </label>
            <input
              type="text"
              id="name"
              name="name" 
              onChange={formik.handleChange}
              value={formik.values.name}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Martin"
            />
            {formik.errors.name ? (
              <div className="text-red-600">{formik.errors.name}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="surname" className="text-black">
              Příjmení
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              onChange={formik.handleChange}
              value={formik.values.surname}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Procházka"
            />
            {formik.errors.surname ? (
              <div className="text-red-600">{formik.errors.surname}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="city" className="text-black">
              Město
            </label>
            <input
              type="text"
              id="city"
              name="city"
              onChange={formik.handleChange}
              value={formik.values.city}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Most"
            />
            {formik.errors.city ? (
              <div className="text-red-600">{formik.errors.city}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="street" className="text-black">
              Ulice
            </label>
            <input
              type="text"
              id="street"
              name="street"
              onChange={formik.handleChange}
              value={formik.values.street}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Stříbrnická 319/23"
            />
            {formik.errors.street ? (
              <div className="text-red-600">{formik.errors.street}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="postcode" className="text-black">
              PSČ
            </label>
            <input
              type="text"
              id="postcode"
              name="postcode"
              onChange={formik.handleChange}
              value={formik.values.postcode}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 41201"
            />
            {formik.errors.postcode ? (
              <div className="text-red-600">{formik.errors.postcode}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="birth_date" className="text-black">
              Datum narození (RRRR-MM-DD)
            </label>
            <input
              type="text"
              id="birth_date"
              name="birth_date"
              onChange={formik.handleChange}
              value={formik.values.birth_date}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 2000-08-01"
            />
            {formik.errors.birth_date ? (
              <div className="text-red-600">{formik.errors.birth_date}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="phone" className="text-black">
              Tel. číslo
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              onChange={formik.handleChange}
              value={formik.values.phone}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 777123456"
            />
            {formik.errors.phone ? (
              <div className="text-red-600">{formik.errors.phone}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="email" className="text-black">
              E-mail
            </label>
            <input
              type="text"
              id="email"
              name="email"
              onChange={formik.handleChange}
              value={formik.values.email}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. email@example.com"
            />
            {formik.errors.email ? (
              <div className="text-red-600">{formik.errors.email}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="number" className="text-black">
              Číslo řidiče
            </label>
            <input
              type="number"
              id="number"
              name="number"
              onChange={formik.handleChange}
              value={formik.values.number}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 16"
              min="0"
            />
            {formik.errors.number ? (
              <div className="text-red-600">{formik.errors.number}</div>
            ) : null}
          </div>

          <div className="flex justify-center font-body my-3">
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

export default EditDriverForm;
