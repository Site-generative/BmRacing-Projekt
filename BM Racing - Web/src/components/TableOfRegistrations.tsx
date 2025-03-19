import { useEffect, useState } from 'react';
import api from '../services/api';
import {Registrations} from '../utils/commonTypes';
import { NavLink } from 'react-router-dom';
import ConfigurationInfo from './ConfigurationInfo';
import { toast } from 'react-toastify';

const TableOfRegistrations = ({ searchQuery, event_id }: { searchQuery: string; event_id: number }) => {
    const [registrations, setRegistrations] = useState<Registrations[]>([]);
    const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
    const [selectedConfigurationID] = useState<number | null>(null);
    const [sortColumn, setSortColumn] = useState('driver_surname');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        api.getRegistrationsByEventId(event_id)
            .then((response) => {
                const results = response.data.data as unknown as Registrations[];

                const sortedData = results.sort((a, b) => {
                    const aValue = (a.driver_surname ?? '').toLowerCase();
                    const bValue = (b.driver_surname ?? '').toLowerCase();
                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                  });
          
                setRegistrations(sortedData);
            })
    }, [event_id]);

    const handleSort = (column: keyof Registrations) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
    
        const sortedData = [...registrations].sort((a, b) => {
        const aValue = (a[column] ?? '').toString().toLowerCase();
        const bValue = (b[column] ?? '').toString().toLowerCase();
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
        });
    
        setRegistrations(sortedData);
    };

    const filteredData = registrations.filter((result) =>
        result.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.driver_surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.car_maker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.car_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.configuration_status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.power_weight_ratio.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.excessive_modifications.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const deletePopup = (id: number) => {
        if (window.confirm('Jste si jistý že chcete smazat tuto registraci?')) {
            deleteRegistration(id);
            toast.success('Registrace byla uspěšně smazána!');
        }
    };

    const deleteRegistration = async (id: number) => {
        try {
          const response = await api.deleteRegistration(Number(id));
          if (response.status === 200 || response.status === 204) {
            setRegistrations((prevRegistrations) =>
              prevRegistrations.filter((registration) => registration.event_registration_id !== id)
            );
          }
        } catch (error) {
          console.error('Error deleting registration', error);
        }
      };

    return (
        <div className="px-4 h-3/4 sm:h-full">
            {isConfigurationOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 h-fit sm:h-screen z-[1000] mt-20 sm:mt-0">
                    <div className='h-min w-full sm:w-2/3 bg-white rounded-md shadow-lg'>
                        <div className='flex flex-col md:flex-row h-max w-full justify-between items-center pr-0 md:p-4 py-4'>
                            <button onClick={() => setIsConfigurationOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                                    <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
                                </svg>
                            </button>
                        </div>
                        <div className='px-4 z-[1000]'>
                            <ConfigurationInfo id={selectedConfigurationID} />
                        </div>
                    </div>
                </div>
            )}
            <div className='h-full max-h-[50vh] overflow-y-scroll overflow-x-auto'>
                <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                    <thead className="bg-red-600">
                        <tr>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer ${sortColumn === 'driver_name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('driver_name')}>
                            Jméno {sortColumn === 'driver_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'driver_surname' ? 'bg-red-700' : ''}`} onClick={() => handleSort('driver_surname')}>
                            Příjmení {sortColumn === 'driver_surname' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'car_maker' ? 'bg-red-700' : ''}`} onClick={() => handleSort('car_maker')}>
                            Výrobce auta {sortColumn === 'car_maker' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'car_type' ? 'bg-red-700' : ''}`} onClick={() => handleSort('car_type')}>
                            Model auta {sortColumn === 'car_type' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'configuration_status' ? 'bg-red-700' : ''}`} onClick={() => handleSort('configuration_status')}>
                            Status konfigurace {sortColumn === 'configuration_status' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'category_name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('category_name')}>
                            Kategorie {sortColumn === 'category_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'power_weight_ratio' ? 'bg-red-700' : ''}`} onClick={() => handleSort('power_weight_ratio')}>
                            Poměr výkon/váha {sortColumn === 'power_weight_ratio' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'excessive_modifications' ? 'bg-red-700' : ''}`} onClick={() => handleSort('excessive_modifications')}>
                            Nadměrné úpravy {sortColumn === 'excessive_modifications' && (sortOrder === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center">Nejsou dostupné žádné registrace</td>
                            </tr>
                        ) : (
                            filteredData.map((result, index) => (
                                <tr key={index} className='bg-zinc-800 text-white'>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'driver_name' ? 'bg-zinc-900' : ''}`}>{result.driver_name}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'driver_surname' ? 'bg-zinc-900' : ''}`}>{result.driver_surname}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'car_maker' ? 'bg-zinc-900' : ''}`}>{result.car_maker}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'car_type' ? 'bg-zinc-900' : ''}`}>{result.car_type}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'configuration_status' ? 'bg-zinc-900' : ''}`}>{result.configuration_status}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'category_name' ? 'bg-zinc-900' : ''}`}>{result.category_name}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'power_weight_ratio' ? 'bg-zinc-900' : ''}`}>{result.power_weight_ratio}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'excessive_modifications' ? 'bg-zinc-900' : ''}`}>{result.excessive_modifications}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                    <NavLink to={`/edit-registration/${result.event_registration_id}`}>
                                        <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.event_registration_id.toString()}>Upravit</button>
                                    </NavLink>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <button className='bg-red-600 rounded-full px-4 py-1 hover:bg-red-700 duration-100 active:bg-red-800' id={result.event_registration_id.toString()} onClick={() => deletePopup(result.event_registration_id)}>Smazat</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableOfRegistrations;