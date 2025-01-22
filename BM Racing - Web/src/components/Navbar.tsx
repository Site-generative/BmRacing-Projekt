import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/home');
  };

  const handleLoginButtonClick = () => {
    navigate('/login');
  };

  return (
    <nav className='w-screen h-20 bg-zinc-900 align-center flex z-10 absolute justify-between items-center'>
      <button onClick={handleButtonClick}>
        <img src="/images/logo-white.webp" alt="Logo" className='h-full w-44 sm:w-52 p-3 ml-8 select-none'/>
      </button>
      <button onClick={handleLoginButtonClick} className='text-white border-2 border-red-600 px-4 py-1 rounded-full font-body hover:bg-red-600 duration-150 text-sm h-min mr-8 active:bg-red-700 select-none'>Přihlášení</button>
    </nav>
  )
}

export default Navbar
