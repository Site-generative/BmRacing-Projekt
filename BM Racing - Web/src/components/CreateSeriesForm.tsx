import React, { useState } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import TableOfSeries from "./TableOfSeries";
import { toast } from 'react-toastify';

const CreateSeriesForm = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
  };

  const formik = useFormik({
    initialValues: {      
      name: '',
      year: '',
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        console.log('Values:', values.name, values.year);
        await api.createSeries(values.name, values.year);
        toast.success('Nová série byla úspěšně vytvořena!');
        navigate('/table-series');
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        setSubmitError(error.response?.data?.message || 'Nepodařilo se vytvořit novou sérii.');
      }
      
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.name) {
        errors.name = "Vyplňte název série";
      }
      if (!values.year) {
        errors.year = "Vyplňte ročník série";
      }

      return errors;
    },
  });

  return (
    <div className="flex flex-col lg:flex-row w-full pl-0 lg:pl-10 pt-10">
      <div className="flex-grow max-w-screen-sm mx-10">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-center lg:text-left">
            <h1 className="font-body text-5xl font-medium py-2">
              Vytvoření série
            </h1>
          </div>
          <div className="flex flex-col font-body my-1">
            <label htmlFor="name" className="text-black">
              Název*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              onChange={formik.handleChange}
              value={formik.values.name}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border-2 focus:border-gray-600 bg-white"
              placeholder="např. MotoGP World Championship"
            />
            {formik.errors.name ? (
              <div className="text-red-600">{formik.errors.name}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="year" className="text-black">
              Ročník (RRRR)*
            </label>
            <input
              type="text"
              id="year"
              name="year"
              onChange={formik.handleChange}
              value={formik.values.year}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border-2 focus:border-gray-600 bg-white"
              placeholder="např. 2024"
            />
            {formik.errors.year ? (
              <div className="text-red-600">{formik.errors.year}</div>
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
          <TableOfSeries searchQuery={searchQuery}/>
        </div>
      </div>
      </div>
  );
};

export default CreateSeriesForm;
