import { useState } from 'react';
import Navbar from '../components/Navbar';
import NavbarAdmin from '../components/NavbarAdmin';
import { useAuth } from '../contexts/AuthContext';
import TableOfCars from '../components/TableOfCars';

export default function TableSeries() {
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="min-h-screen bg-stone-100">
            {isAuthenticated ? <NavbarAdmin /> : <Navbar />}
            <div className='w-screen h-screen flex flex-col pt-20'>
                <div className='flex flex-col lg:flex-row justify-between px-8 items-center gap-0 xl:gap-24'>
                    <h1 className='font-body text-5xl font-medium py-8 text-center sm:text-left'>
                        Tabulka aut
                    </h1>
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
                <div className='w-screen p-0 sm:p-4 mt-4 sm:mt-0 overflow-y-scroll'>
                    <TableOfCars searchQuery={searchQuery}/>
                </div>
            </div>
        </div>
    );
}