import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleButtonClick = () => {
    navigate('/home');
  };

  const handleLoginButtonClick = () => {
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className='w-screen h-min bg-zinc-900 flex fixed justify-between items-center px-4 lg:px-8 z-[500]'>
      <button onClick={handleButtonClick}>
        <img src="/images/logo-white.webp" alt="Logo" className='h-full w-52 p-3 select-none'/>
      </button>
      <div className='flex justify-end'>
        <button className='lg:hidden text-white text-3xl pr-4' onClick={toggleMobileMenu}>
          ☰
        </button>
        <ul className='hidden lg:flex flex-row items-center'>
          <li className='my-2 lg:my-0 lg:mx-4'>
            <NavLink to='/home' className={({ isActive }) => isActive ? 'text-red-600 font-body font-medium text-sm lg:text-lg whitespace-nowrap select-none' : 'text-white font-body font-medium text-sm lg:text-lg whitespace-nowrap hover:text-red-600 duration-150 select-none'}>
              Domů
            </NavLink>
          </li>
          
          <li className="my-2 lg:my-0 lg:mx-4">
            <NavLink to='/table-races' className={({ isActive }) => isActive ? 'text-red-600 font-body font-medium text-sm lg:text-lg whitespace-nowrap select-none' : 'text-white font-body font-medium text-sm lg:text-lg whitespace-nowrap hover:text-red-600 duration-150 select-none'}>
              Závody
            </NavLink>
          </li>
          
          <li className='my-2 lg:my-0 lg:ml-4 lg:mr-10 select-none'>
            <button onClick={handleLoginButtonClick} className='text-white border-2 border-red-600 px-4 lg:px-8 py-1 rounded-full font-body hover:bg-red-600 duration-150 text-sm lg:text-lg whitespace-nowrap active:bg-red-700'>Přihlásit se</button>
          </li>
        </ul>
      </div>
      {isMobileMenuOpen && (
        <div className='absolute top-full left-0 w-full bg-zinc-900 flex flex-col lg:hidden rounded-b-md'>
          <ul className='flex flex-col items-center'>
            <NavLink to='/home' className={({ isActive }) => isActive ? 'text-red-600 font-body font-medium text-sm' : 'text-white font-body font-medium text-sm hover:text-red-600 duration-150'}>
              <li className='w-screen text-center py-2'>
                  Domů
              </li>
            </NavLink>
            <NavLink to='/table-races' className={({ isActive }) => isActive ? 'text-red-600 font-body font-medium text-sm' : 'text-white font-body font-medium text-sm hover:text-red-600 duration-150'}>
              <li className='w-screen text-center py-2'>
                  Závody
              </li>
            </NavLink>
            <li className='w-screen text-center py-4 select-none'>
              <button onClick={handleLoginButtonClick} className='text-white border-2 border-red-600 px-4 py-1 rounded-full font-body hover:bg-red-600 duration-150 text-sm active:bg-red-700'>Přihlásit se</button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}

export default Navbar
