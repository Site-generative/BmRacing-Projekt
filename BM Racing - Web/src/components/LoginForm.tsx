import { useFormik } from 'formik';
import { useState } from 'react';
import { Login } from '../utils/commonTypes';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginForm: React.FC = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        const loginData: Login = {
          username: values.username,
          password: values.password
        };

        setLoading(true);
        
        await api.login(loginData);
  
        setLoading(false);

        login();
        toast.success('Uspěšně jste se přihlásil!');
        navigate(`/home`);
        setSubmitError(null);
      } catch (error) {
        setLoading(false);
        setSubmitError('Nepodařilo se přihlásit. Zkontrolujte uživatelské<br />jméno nebo heslo a zkuste to znovu.');
      }
    },
    validate: (values) => {
      const errors: { username?: string; password?: string } = {};

      if (!values.username) {
        errors.username = 'Vyplňte vaše uživatelské jméno';
      }
      if (!values.password) {
        errors.password = 'Vyplňte heslo';
      }

      return errors;
    }
  });

  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-lg shadow-lg p-8">
      <form onSubmit={formik.handleSubmit} className='py-4'>
        <h1 className='text-white text-3xl font-body font-medium text-center mb-8'>Přihlášení</h1>

        <div className='flex flex-col font-body my-4 relative'>
          <label htmlFor="username" className='text-white'>Uživatelské jméno</label>
          <input
            type="text"
            id='username'
            name='username'
            onChange={formik.handleChange}
            value={formik.values.username}
            className='rounded-md border border-gray-600 font-light py-1 pl-1 pr-4 focus:outline-none focus:border'
            placeholder='např. Roman'
          />
          {formik.errors.username ? <div className='text-red-700'>{formik.errors.username}</div> : null}
        </div>

        <div className='flex flex-col font-body my-4 relative'>
          <label htmlFor="password" className='text-white'>Heslo</label>
          <input
            type="password"
            id='password'
            name='password'
            onChange={formik.handleChange}
            value={formik.values.password}
            className='rounded-md border border-gray-600 font-light py-1 pl-1 pr-4 focus:outline-none focus:border'
            placeholder='např. 12345'
          />
          
          {formik.errors.password ? <div className='text-red-700'>{formik.errors.password}</div> : null}
        </div>

        <div className='flex justify-center font-body mt-8'>
          <button type='submit' className='bg-red-500 text-white py-1 px-5 hover:px-7 duration-100 rounded-full active:bg-red-700 flex items-center'>
            Přihlásit se
            {loading && <div className="spinner ml-2"></div>}
          </button>
        </div>

        {submitError && (
          <div className="error-message text-red-300 text-center pt-4" dangerouslySetInnerHTML={{ __html: submitError }} />
        )}
      </form>
    </div>
  );
};

export default LoginForm;