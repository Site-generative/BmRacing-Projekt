import { useEffect, useState } from 'react';
import { Drivers } from '../utils/commonTypes';
import api from '../services/api';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';

const TableOfDrivers = ({ searchQuery }: { searchQuery: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [drivers, setDrivers] = useState<Drivers[]>([]);
    const [sortColumn, setSortColumn] = useState<keyof Drivers>('surname');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchSeries = async () => {
          try {
            const response = await api.getAllDrivers();
            const driversData = response.data.data;

            const sortedData = driversData.sort((a: Drivers, b: Drivers) => {
              if (a.surname.toLowerCase() < b.surname.toLowerCase()) return -1;
              if (a.surname.toLowerCase() > b.surname.toLowerCase()) return 1;
              return 0;
            });
    
            setDrivers(sortedData);
          } catch (err) {
            console.error('Error fetching series:', err);
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchSeries();
      }, []);

      const handleSort = (column: keyof Drivers) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
    
        const sortedData = [...drivers].sort((a, b) => {
          const aValue = column === 'number' ? Number(a[column]) : (a[column] ?? '').toString().toLowerCase();
          const bValue = column === 'number' ? Number(b[column]) : (b[column] ?? '').toString().toLowerCase();
          if (aValue < bValue) return order === 'asc' ? -1 : 1;
          if (aValue > bValue) return order === 'asc' ? 1 : -1;
          return 0;
        });
    
        setDrivers(sortedData);
      };

    const filteredData = drivers.filter((result) =>
        result?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.street?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.postcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.birth_date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result?.number?.toString().includes(searchQuery.toString()) ||
        (result?.racebox_id !== null && result?.racebox_id !== undefined && result?.racebox_id.toString().includes(searchQuery.toString()))
    );

    const deletePopup = (id: number) => {
        if (window.confirm('Jste si jistý že chcete smazat totoho řidiče?')) {
            deleteDriver(id);
            toast.success('Řidič byl uspěšně smazán!');
        }
    };

    const deleteDriver = async (id: number) => {
        try {
          const response = await api.deleteDriver(Number(id));
          if (response.status === 200 || response.status === 204) {
            window.location.reload();
          }
        } catch (error) {
          console.error('Error deleting series', error);
        }
      };

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
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer ${sortColumn === 'name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('name')}>
                      Jméno {sortColumn === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer whitespace-nowrap ${sortColumn === 'surname' ? 'bg-red-700' : ''}`} onClick={() => handleSort('surname')}>
                      Příjmení {sortColumn === 'surname' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'city' ? 'bg-red-700' : ''}`} onClick={() => handleSort('city')}>
                      Město {sortColumn === 'city' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'street' ? 'bg-red-700' : ''}`} onClick={() => handleSort('street')}>
                      Ulice {sortColumn === 'street' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'postcode' ? 'bg-red-700' : ''}`} onClick={() => handleSort('postcode')}>
                      PSČ {sortColumn === 'postcode' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'birth_date' ? 'bg-red-700' : ''}`} onClick={() => handleSort('birth_date')}>
                      Datum narození {sortColumn === 'birth_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'phone' ? 'bg-red-700' : ''}`} onClick={() => handleSort('phone')}>
                      Telefon {sortColumn === 'phone' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'email' ? 'bg-red-700' : ''}`} onClick={() => handleSort('email')}>
                      E-mail {sortColumn === 'email' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'number' ? 'bg-red-700' : ''}`} onClick={() => handleSort('number')}>
                      Číslo řidiče {sortColumn === 'number' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>

                    {/* Nepoužívá se

                    <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'racebox_id' ? 'bg-red-700' : ''}`} onClick={() => handleSort('racebox_id')}>
                      Racebox ID {sortColumn === 'racebox_id' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>

                    */}

                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'name' ? 'bg-zinc-900' : ''}`}>{result.name}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'surname' ? 'bg-zinc-900' : ''}`}>{result.surname}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'city' ? 'bg-zinc-900' : ''}`}>{result.city}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'street' ? 'bg-zinc-900' : ''}`}>{result.street}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'postcode' ? 'bg-zinc-900' : ''}`}>{result.postcode}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'birth_date' ? 'bg-zinc-900' : ''}`}>{new Date(result.birth_date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s/g, '')}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'phone' ? 'bg-zinc-900' : ''}`}>{result.phone}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'email' ? 'bg-zinc-900' : ''}`}>{result.email}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'number' ? 'bg-zinc-900' : ''}`}>{result.number}</td>

                            {/* Nepoužívá se

                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'racebox_id' ? 'bg-zinc-900' : ''}`}>{result.racebox_id ?? 'Nemá'}</td>

                            */}
                            
                            <td className="px-6 py-2 whitespace-nowrap">
                                <NavLink to={`/edit-driver/${result.id}`}>
                                    <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()}>Upravit</button>
                                </NavLink>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                                <button className='bg-red-600 rounded-full px-4 py-1 hover:bg-red-700 duration-100 active:bg-red-800' id={result.id.toString()} onClick={() => deletePopup(result.id)}>Smazat</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfDrivers;