import { useEffect, useState } from 'react';
import { Races } from '../utils/commonTypes';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useParams } from 'react-router-dom';
import TableOfResults from '../components/TableOfResults';
import TableOfRegistrations from '../components/TableOfRegistrations';

const TableOfRaces = ({ searchQuery }: { searchQuery: string }) => {
    const [results, setResults] = useState<Races[]>([]);
    const { isAuthenticated } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [searchQuery2, setSearchQuery] = useState('');
    const [searchQuery3, setSearchQuery3] = useState('');
    const [sortColumn, setSortColumn] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const {urlName} = useParams<{ urlName?: string }>();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchChange3 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery3(e.target.value);
    };

    useEffect(() => {
        api.getAllRaces()
            .then((response) => {
                const races = response.data.data as unknown as Races[];

                const sortedData = races.sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB.getTime() - dateA.getTime();
                });

                setResults(sortedData);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching races:', error);
            });
    }, []);

    const handleSort = (column: keyof Races) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
    
        const sortedData = [...results].sort((a, b) => {
            if (column === 'number_of_laps') {
                const aValue = Number(a[column]);
                const bValue = Number(b[column]);
                if (aValue < bValue) return order === 'asc' ? -1 : 1;
                if (aValue > bValue) return order === 'asc' ? 1 : -1;
                return 0;
            } else {
                const aValue = (a[column] ?? '').toString().toLowerCase();
                const bValue = (b[column] ?? '').toString().toLowerCase();
                if (aValue < bValue) return order === 'asc' ? -1 : 1;
                if (aValue > bValue) return order === 'asc' ? 1 : -1;
                return 0;
            }
        });
    
        setResults(sortedData);
      };

    const filteredData = results.filter((result) =>{
        const matchesSearchQuery =
            result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.number_of_laps.toString().includes(searchQuery) ||
            new Date(result.date).toLocaleString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.series_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.phase_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSeriesId = urlName ? result.series_name.toLowerCase().trim() === urlName.toLowerCase().trim() : true;

        return matchesSearchQuery && matchesSeriesId;
    });

    const noRacesInSeries = urlName && filteredData.length === 0;

    const openResults = (id: number) => {
        setSelectedEventId(id);
        setIsResultsOpen(true);
    };

    const openRegistrations = (id: number) => {
        setSelectedEventId(id);
        setIsRegistrationsOpen(true);
    }

    return (
        <div className="overflow-x-auto">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <span className="text-xl font-body">Načítání ...</span>
                </div>
            )}
            {isResultsOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-10">
                    <div className='h-4/5 sm:h-2/3 w-full sm:w-2/3 bg-white rounded-md shadow-lg'>
                        <div className='flex flex-col md:flex-row h-max w-full justify-between items-center pr-0 md:p-4 py-4'>
                            <button onClick={() => setIsResultsOpen(false)} className="md:ml-4 md:mt-2 mb-2 md:mb-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                                    <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
                                </svg>
                            </button>

                            <div className='relative ml-0 md:ml-4 w-auto max-w-xs md:max-w-xs lg:max-w-xs mt-12 sm:mt-4'>
                                <input
                                    type="text"
                                    placeholder="Hledat..."
                                    value={searchQuery2}
                                    onChange={handleSearchChange}
                                    className="rounded-full h-max py-2 pl-4 pr-8 border-2 border-red-600 bg-white font-body focus:outline-none w-full"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <path fill="#f87171" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                                </svg>
                            </div>
                        </div>

                        <div className='px-4'>
                            <TableOfResults searchQuery={searchQuery2} event_id={selectedEventId ?? 0}/>
                        </div>
                    </div>
                </div>
            )}
            {isRegistrationsOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 bg-opacity-75 z-10">
                    <div className='h-3/4 sm:h-2/3 w-full sm:w-2/3 bg-white rounded-md shadow-lg'>
                        <div className='flex flex-col md:flex-row h-max w-full justify-between items-center pr-0 md:p-4 py-4'>
                            <button onClick={() => setIsRegistrationsOpen(false)} className="md:ml-4 md:mt-2 mb-2 md:mb-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                                    <path fill="#ef4444" d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
                                </svg>
                            </button>

                            <NavLink to={`/create-registration/${selectedEventId}`}>
                                <button className='text-white font-body mt-4 bg-blue-400 rounded-full px-4 py-1 hover:bg-blue-500 duration-100 active:bg-blue-700'>Přidat</button>
                            </NavLink>

                            <div className='relative ml-0 md:ml-4 w-auto max-w-xs md:max-w-xs lg:max-w-xs mt-12 sm:mt-4'>
                                <input
                                    type="text"
                                    placeholder="Hledat..."
                                    value={searchQuery3}
                                    onChange={handleSearchChange3}
                                    className="rounded-full h-max py-2 pl-4 pr-8 border-2 border-red-600 bg-white font-body focus:outline-none w-full"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <path fill="#f87171" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                                </svg>
                            </div>
                        </div>

                        <div className='px-4'>
                            <TableOfRegistrations searchQuery={searchQuery3} event_id={selectedEventId ?? 0}/>
                        </div>
                    </div>
                </div>
            )}

            <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                <thead className="bg-red-600">
                    <tr>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer ${sortColumn === 'name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('name')}>
                        Jméno {sortColumn === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'number_of_laps' ? 'bg-red-700' : ''}`} onClick={() => handleSort('number_of_laps')}>
                        Počet kol {sortColumn === 'number_of_laps' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'date' ? 'bg-red-700' : ''}`} onClick={() => handleSort('date')}>
                        Datum {sortColumn === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'location' ? 'bg-red-700' : ''}`} onClick={() => handleSort('location')}>
                        Lokace {sortColumn === 'location' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'series_name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('series_name')}>
                        Název série {sortColumn === 'series_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'phase_name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('phase_name')}>
                        Fáze závodu {sortColumn === 'phase_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        {isAuthenticated && (
                        <>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        </>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                    </tr>
                </thead>
                <tbody className="divide-gray-200">
                    {noRacesInSeries ? (
                        <tr>
                            <td colSpan={9} className="text-center text-zinc-900 bg-transparent text-xl">
                                Žádné závody v této sérii nejsou k dispozici.
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((result, index) => (
                            <tr key={index} className='bg-zinc-800 text-white'>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'name' ? 'bg-zinc-900' : ''}`}>{result.name}</td>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'number_of_laps' ? 'bg-zinc-900' : ''}`}>{result.number_of_laps}</td>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'date' ? 'bg-zinc-900' : ''}`}>{new Date(result.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s/g, '')}</td>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'location' ? 'bg-zinc-900' : ''}`}>{result.location}</td>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'series_name' ? 'bg-zinc-900' : ''}`}>{result.series_name}</td>
                                <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'phase_name' ? 'bg-zinc-900' : ''}`}>{result.phase_name}</td>
                                <td className="px-6 py-2 whitespace-nowrap">
                                    <button className='bg-blue-500 rounded-full px-4 py-1 hover:bg-blue-600 duration-100 active:bg-blue-700' id={result.id.toString()} onClick={() => openResults(result.id)}>Výsledky</button>
                                </td>
                                {isAuthenticated && (
                                    <>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <NavLink to={`/edit-race/${result.id}`}>
                                        <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()}>Upravit</button>
                                        </NavLink>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <button className='bg-orange-400 rounded-full px-4 py-1 hover:bg-orange-500 duration-100 active:bg-orange-700' id={result.id.toString()} onClick={() => openRegistrations(result.id)}>Registrace</button>
                                    </td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfRaces;