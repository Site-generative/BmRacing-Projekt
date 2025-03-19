import React, { useState } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const formatDate = (date : any) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (`0${d.getMonth() + 1}`).slice(-2);
  const day = (`0${d.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
};

const CreateDriverForm = ({ route, onDriverCreated  }: { route: string, onDriverCreated: (id: number) => void }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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
      web_user: '',
      web_password: '',
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        const response = await api.createDriver(values.name, values.surname, values.city, values.street, Number(values.postcode), values.birth_date, values.phone, values.email, Number(values.number), values.web_user, values.web_password);

        onDriverCreated(response.data.id);
        
        toast.success('Řidič byl úspěšně vytvořen!');
        navigate(route);
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        setSubmitError(error.response?.data?.message || 'Nepodařilo se vytvořit nového řidiče.');
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
      if (!values.email) {
        errors.email = "Vyplňte e-mail";
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = 'E-mail musí být v platném formátu';
      }
      if (!values.number) {
        errors.number = "Vyplňte číslo řidiče";
      }
      if (!values.web_user) {
        errors.web_user = "Vyplňte přihlašovací jméno";
      }
      if (!values.web_password) {
        errors.web_password = "Vyplňte heslo";
      }

      return errors;
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex w-fit px-0 lg:px-10 justify-center pt-2">
      <div className="">
        <form onSubmit={formik.handleSubmit} autoComplete="off">
          <div className="w-full text-center lg:text-left">
            <h1 className="font-body text-5xl font-medium py-2">
              Vytvoření řidiče
            </h1>
          </div>
          <div className="flex flex-col font-body my-1">
            <label htmlFor="name" className="text-black">
              Jméno*
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
              Příjmení*
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
              Město*
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
              Ulice*
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
              PSČ*
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
              Datum narození*
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              onChange={(e) => formik.setFieldValue('birth_date', formatDate(e.target.value))}
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
              E-mail*
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
              Číslo řidiče*
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

          <div className="flex flex-col font-body my-1">
            <label htmlFor="web_user" className="text-black">
              Přihlašovací jméno*
            </label>
            <input
              type="text"
              id="web_user"
              name="web_user"
              onChange={formik.handleChange}
              value={formik.values.web_user}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. martinprochazka2933"
              autoComplete="new-username"
            />
            {formik.errors.web_user ? (
              <div className="text-red-600">{formik.errors.web_user}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 relative">
          <label htmlFor="web_password" className="text-black">
            Heslo*
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="web_password"
            name="web_password"
            onChange={formik.handleChange}
            value={formik.values.web_password}
            className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-10 focus:outline-none focus:border focus:border-gray-300 bg-white"
            placeholder="např. passexample123"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-10 transform -translate-y-1/2 text-gray-600"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" height="14" width="15.75" viewBox="0 0 576 512"><path d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128 128 0 1 1 0 256 128 128 0 1 1 0-256z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" height="14" width="17.5" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zm151 118.3C226 97.7 269.5 80 320 80c65.2 0 118.8 29.6 159.9 67.7C518.4 183.5 545 226 558.6 256c-12.6 28-36.6 66.8-70.9 100.9l-53.8-42.2c9.1-17.6 14.2-37.5 14.2-58.7c0-70.7-57.3-128-128-128c-32.2 0-61.7 11.9-84.2 31.5l-46.1-36.1zM394.9 284.2l-81.5-63.9c4.2-8.5 6.6-18.2 6.6-28.3c0-5.5-.7-10.9-2-16c.7 0 1.3 0 2 0c44.2 0 80 35.8 80 80c0 9.9-1.8 19.4-5.1 28.2zm9.4 130.3C378.8 425.4 350.7 432 320 432c-65.2 0-118.8-29.6-159.9-67.7C121.6 328.5 95 286 81.4 256c8.3-18.4 21.5-41.5 39.4-64.8L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5l-41.9-33zM192 256c0 70.7 57.3 128 128 128c13.3 0 26.1-2 38.2-5.8L302 334c-23.5-5.4-43.1-21.2-53.7-42.3l-56.1-44.2c-.2 2.8-.3 5.6-.3 8.5z"/></svg>
            )}
          </button>
          {formik.errors.web_password ? (
            <div className="text-red-600">{formik.errors.web_password}</div>
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

export default CreateDriverForm;
