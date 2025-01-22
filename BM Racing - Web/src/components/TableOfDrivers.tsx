import { useEffect, useState } from 'react';
import { Drivers } from '../utils/commonTypes';
import api from '../services/api';
import { NavLink } from 'react-router-dom';

const TableOfDrivers = ({ searchQuery }: { searchQuery: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [drivers, setDrivers] = useState<Drivers[]>([]);

    useEffect(() => {
        const fetchSeries = async () => {
          try {
            const response = await api.getAllDrivers();
            setDrivers(response.data.data);
          } catch (err) {
            console.error('Error fetching series:', err);
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchSeries();
      }, []);

    const filteredData = drivers.filter((result) =>
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.postcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.birth_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.number.toString().includes(searchQuery.toString()) ||
        (result.racebox_id !== null && result.racebox_id !== undefined && result.racebox_id.toString().includes(searchQuery.toString()))
    );

    return (
        <div className="overflow-x-auto">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <span className="text-xl font-body">Načítání ...</span>
                </div>
            )}
            <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                <thead className="bg-red-600">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Jméno</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Příjmení</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Město</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Ulice</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">PSČ</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Datum narození</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Tel. číslo</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">E-mail</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Číslo řidiče</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Racebox ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                            <td className="px-6 py-2 whitespace-nowrap">{result.name}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.surname}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.city}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.street}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.postcode}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{new Date(result.birth_date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s/g, '')}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.phone}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.email}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.number}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.racebox_id ?? 'Nemá'}</td>
                            <td className="px-6 py-2 whitespace-nowrap">
                                <NavLink to={`/edit-driver/${result.id}`}>
                                    <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()}>Upravit</button>
                                </NavLink>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfDrivers;