import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';

const EditDriverForm = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showPassword, setShowPassword] = useState(false);

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
          web_user: response.data.data.web_user,
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
      web_user: '',
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

  const passwordFormik = useFormik({
    initialValues: {
      web_password: '',
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        console.log(Number(id), values.web_password)
        await api.updateDriverPassword(Number(id), values.web_password);
        toast.success('Heslo bylo úspěšně změněno!');
        setPasswordSubmitError(null);
      } catch (error: any) {
        console.error('API Error:', error.response);
        setPasswordSubmitError(error.response?.data?.message || 'Nepodařilo se změnit heslo.');
      }
    },
    validate: (values) => {
      const errors: any = {};
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
    <div className="flex w-screen px-0 lg:px-10 justify-center pt-2">
      <div className="">
        <div className="w-full text-center">
          <h1 className="font-body text-5xl font-medium py-2">
            Úprava řidiče
          </h1>
        </div>
        <form onSubmit={passwordFormik.handleSubmit} autoComplete="off" className="mb-3">
          <div className="flex flex-col font-body my-1 relative">
            <label htmlFor="web_password" className="text-black">
              Heslo*
            </label>
            <div className="flex items-center relative flex-col sm:flex-row">
              <input
                type={showPassword ? 'text' : 'password'}
                id="web_password"
                name="web_password"
                onChange={passwordFormik.handleChange}
                value={passwordFormik.values.web_password}
                className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-10 w-full focus:outline-none focus:border focus:border-gray-300 bg-white"
                placeholder="např. passexample123"
                autoComplete="new-password"
              />
              
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-5 sm:right-[40%] top-[23%] sm:top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" height="14" width="15.75" viewBox="0 0 576 512"><path d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128 128 0 1 1 0 256 128 128 0 1 1 0-256z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" height="14" width="17.5" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zm151 118.3C226 97.7 269.5 80 320 80c65.2 0 118.8 29.6 159.9 67.7C518.4 183.5 545 226 558.6 256c-12.6 28-36.6 66.8-70.9 100.9l-53.8-42.2c9.1-17.6 14.2-37.5 14.2-58.7c0-70.7-57.3-128-128-128c-32.2 0-61.7 11.9-84.2 31.5l-46.1-36.1zM394.9 284.2l-81.5-63.9c4.2-8.5 6.6-18.2 6.6-28.3c0-5.5-.7-10.9-2-16c.7 0 1.3 0 2 0c44.2 0 80 35.8 80 80c0 9.9-1.8 19.4-5.1 28.2zm9.4 130.3C378.8 425.4 350.7 432 320 432c-65.2 0-118.8-29.6-159.9-67.7C121.6 328.5 95 286 81.4 256c8.3-18.4 21.5-41.5 39.4-64.8L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5l-41.9-33zM192 256c0 70.7 57.3 128 128 128c13.3 0 26.1-2 38.2-5.8L302 334c-23.5-5.4-43.1-21.2-53.7-42.3l-56.1-44.2c-.2 2.8-.3 5.6-.3 8.5z"/></svg>
                )}
              </button>

              <button
                type="submit"
                className="bg-blue-500 text-white py-1 px-4 ml-2 hover:bg-blue-600 rounded-full active:bg-blue-700 mt-2 sm:mt-0 whitespace-nowrap"
              >
                Změnit heslo
              </button>
            </div>
            {passwordFormik.errors.web_password ? (
              <div className="text-red-600 text-center">{passwordFormik.errors.web_password}</div>
            ) : null}
            {passwordSubmitError && (
              <div className="text-red-600 text-center">{passwordSubmitError}</div>
            )}
          </div>
          </form>
        <form onSubmit={formik.handleSubmit} autoComplete="off">

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
              autoComplete="web_user"
            />
            {formik.errors.web_user ? (
              <div className="text-red-600">{formik.errors.web_user}</div>
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
