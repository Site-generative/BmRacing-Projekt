import { useEffect, useState } from 'react';
import api from '../services/api';
import {Registrations} from '../utils/commonTypes';
import { NavLink } from 'react-router-dom';
import ConfigurationInfo from './ConfigurationInfo';

const TableOfRegistrations = ({ searchQuery, event_id }: { searchQuery: string; event_id: number }) => {
    const [registrations, setRegistrations] = useState<Registrations[]>([]);
    const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
    const [selectedConfigurationID, setSelectedConfigurationID] = useState<number | null>(null);

    useEffect(() => {
        api.getRegistrationsByEventId(event_id)
            .then((response) => {
                const results = response.data.data as unknown as Registrations[];

                setRegistrations(results);
            })
    }, [event_id]);

    const filteredData = registrations.filter((result) =>
        result.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.driver_surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.car_maker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.car_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.configuration_status.toLowerCase().includes(searchQuery.toLowerCase()) 
    );

    const openConfiguration = (id: number) => {
        setSelectedConfigurationID(id);
        setIsConfigurationOpen(true);
    }

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
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Jméno</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Příjmení</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Výrobce auta</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Model auta</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status konfigurace</th>
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
                                    <td className="px-6 py-2 whitespace-nowrap">{result.driver_name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.driver_surname}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.car_maker}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.car_type}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.configuration_status}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <button 
                                            className={`rounded-full px-4 py-1 duration-100 ${result.car_configuration_id ? 'bg-orange-400 hover:bg-orange-500 active:bg-orange-700' : 'bg-gray-400 cursor-not-allowed'}`} 
                                            id={result.car_configuration_id?.toString()} 
                                            onClick={() => result.car_configuration_id && openConfiguration(result.car_configuration_id)}
                                            disabled={!result.car_configuration_id}
                                        >
                                            Zobrazit konfiguraci
                                        </button>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <NavLink to={`/edit-registration/${result.event_registration_id}`}>
                                            <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.event_registration_id.toString()}>Upravit</button>
                                        </NavLink>
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