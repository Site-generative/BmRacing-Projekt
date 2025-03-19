import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavbarAdmin = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleButtonClick = () => {
    navigate('/home');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
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
          <li className='my-2 lg:my-0 lg:mx-4 relative'>
            <NavLink to='#' className='text-white font-body font-medium text-sm lg:text-lg whitespace-nowrap hover:text-red-600 duration-150 select-none' onClick={() => toggleDropdown('create')}>
              Vytváření {openDropdown === 'create' ? '▲' : '▼'}
            </NavLink>
            {openDropdown === 'create' && (
              <ul className="absolute left-0 top-full w-max bg-white shadow-lg rounded-md font-body mt-3">
                <NavLink to='/create-race' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer rounded-t-md border-b border-b-gray-300">
                      Závod
                  </li>
                </NavLink>

                <NavLink to='/create-series' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-gray-300">
                    Série
                  </li>
                </NavLink>

                <NavLink to='/create-driver' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-gray-300">
                    Řidič
                  </li>
                </NavLink>

                <NavLink to='/create-car' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer rounded-b-md">
                    Auto
                  </li>
                </NavLink>
              </ul>
            )}
          </li>
          <li className='my-2 lg:my-0 lg:mx-4 relative'>
            <NavLink to='#' className='text-white font-body font-medium text-sm lg:text-lg whitespace-nowrap hover:text-red-600 duration-150 select-none' onClick={() => toggleDropdown('table')}>
            Tabulky {openDropdown === 'table' ? '▲' : '▼'}
            </NavLink>
            {openDropdown === 'table' && (
              <ul className="absolute left-0 top-full w-max bg-white shadow-lg rounded-md font-body mt-3">
                <NavLink to='/home' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-gray-300 rounded-t-md">
                    Série
                  </li>
                </NavLink>

                <NavLink to='/table-drivers' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-gray-300">
                    Řidiči
                  </li>
                </NavLink>

                <NavLink to='/table-cars' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-gray-300">
                    Auta
                  </li>
                </NavLink>

                <NavLink to='/table-races' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-black font-body'}>
                  <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer rounded-b-md">
                    Závody
                  </li>
                </NavLink>
              </ul>
            )}
          </li>
          <li className='my-2 lg:my-0 lg:ml-4 lg:mr-10 select-none'>
            <button onClick={handleLogout} className='text-white border-2 border-red-600 px-4 lg:px-8 py-1 rounded-full font-body hover:bg-red-600 duration-150 text-sm lg:text-lg whitespace-nowrap active:bg-red-700'>Odhlásit se</button>
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
            <NavLink to='#' className='text-white font-body font-medium text-sm whitespace-nowrap hover:text-red-600 duration-150' onClick={() => toggleDropdown('create')}>
              <li className='w-screen text-center py-2'>
                  Vytvoření {openDropdown === 'create' ? '▲' : '▼'}
                {openDropdown === 'create' && (
                  <ul className="w-full bg-zinc-950 shadow-lg font-body mt-3">
                    <NavLink to='/create-race' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700">
                        Závod
                      </li>
                    </NavLink>

                    <NavLink to='/create-series' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white">
                        Série
                      </li>
                    </NavLink>

                    <NavLink to='/create-driver' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white">
                        Řidič
                      </li>
                    </NavLink>

                    <NavLink to='/create-car' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-white">
                        Auto
                      </li>
                    </NavLink>
                  </ul>
                )}
              </li>
            </NavLink>
            <NavLink to='#' className='text-white font-body font-medium text-sm whitespace-nowrap hover:text-red-600 duration-150' onClick={() => toggleDropdown('table')}>
              <li className=' w-screen text-center py-2'>
                  Tabulky {openDropdown === 'table' ? '▲' : '▼'}
                {openDropdown === 'table' && (
                  <ul className="w-full bg-zinc-950 shadow-lg font-body">
                    <NavLink to='/home' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white mt-2">
                          Série
                      </li>
                    </NavLink>

                    <NavLink to='/table-drivers' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white">
                          Řidiči
                      </li>
                    </NavLink>

                    <NavLink to='/table-cars' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white">
                          Auta
                      </li>
                    </NavLink>

                    <NavLink to='/table-races' className={({ isActive }) => isActive ? 'text-red-600 font-body' : 'text-white font-body'}>
                      <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer border-b border-b-zinc-700 text-white">
                          Závody
                      </li>
                    </NavLink>
                  </ul>
                )}
              </li>
            </NavLink>
            <li className='w-screen text-center py-4 select-none'>
              <button onClick={handleLogout} className='text-white border-2 border-red-600 px-4 py-1 rounded-full font-body hover:bg-red-600 duration-150 text-sm active:bg-red-700'>Odhlásit se</button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavbarAdmin;