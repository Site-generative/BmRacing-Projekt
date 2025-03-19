import { useEffect, useState } from 'react';
import { Car } from '../utils/commonTypes';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface CarWithDriver extends Car {
    driverName?: string;
    driverSurname?: string;
}

const TableOfCars = ({ searchQuery }: { searchQuery: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [cars, setCars] = useState<CarWithDriver[]>([]);
    const navigate = useNavigate();
    const [sortColumn, setSortColumn] = useState<keyof typeof cars[0]>('driverName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchCarsWithDrivers = async () => {
          try {
            const response = await api.getAllCars();
            const carsData = response.data.data;
      
            const carsWithDrivers = await Promise.all(
              carsData.map(async (car: Car) => {
                if (car.default_driver_id) {
                  try {
                    const driverResponse = await api.getDriverById(car.default_driver_id);
                    return { ...car, driverName: driverResponse.data.data.name, driverSurname: driverResponse.data.data.surname };
                  } catch (err) {
                    console.error('Error fetching driver:', err);
                    return { ...car, driverName: 'Není', driverSurname: '' };
                  }
                } else {
                  return { ...car, driverName: 'Není', driverSurname: '' };
                }
              })
            );
      
            const sortedData = carsWithDrivers.sort((a, b) => {
                const aName = (a.driverName ?? '').toLowerCase();
                const bName = (b.driverName ?? '').toLowerCase();
                const aSurname = (a.driverSurname ?? '').toLowerCase();
                const bSurname = (b.driverSurname ?? '').toLowerCase();
      
                if (aName === 'není' || aName === '') return 1;
                if (bName === 'není' || bName === '') return -1;
      
                if (aName < bName) return -1;
                if (aName > bName) return 1;
      
                if (aSurname < bSurname) return -1;
                if (aSurname > bSurname) return 1;
      
                return 0;
              });
      
            setCars(sortedData);
          } catch (err) {
            console.error('Error fetching cars:', err);
          } finally {
            setIsLoading(false);
          }
        };
      
        fetchCarsWithDrivers();
      }, []);

    const handleSort = (column: keyof typeof cars[0]) => {
        const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortOrder(order);
    
        const sortedData = [...cars].sort((a, b) => {
          const aValue = (a[column] ?? '').toString().toLowerCase();
          const bValue = (b[column] ?? '').toString().toLowerCase();
    
          if (aValue === 'není' || aValue === '') return 1;
          if (bValue === 'není' || bValue === '') return -1;
    
          if (aValue < bValue) return order === 'asc' ? -1 : 1;
          if (aValue > bValue) return order === 'asc' ? 1 : -1;
          return 0;
        });
    
        setCars(sortedData);
      };

    const filteredData = cars.filter((result) =>
        result.maker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.default_driver_id?.toString().includes(searchQuery) ||
        result.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.driverSurname?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleClick = (id:number) => {
        navigate(`/edit-car/${id}`);
        
        window.location.reload();
    };

    const deletePopup = (id: number) => {
        if (window.confirm('Jste si jistý že chcete smazat toto auto?')) {
            deleteCar(id);
            toast.success('Auto bylo uspěšně smazáno!');
        }
    };

    const deleteCar = async (id: number) => {
        try {
          const response = await api.deleteCar(Number(id));
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
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer ${sortColumn === 'maker' ? 'bg-red-700' : ''}`} onClick={() => handleSort('maker')}>
                        Výrobce {sortColumn === 'maker' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'type' ? 'bg-red-700' : ''}`} onClick={() => handleSort('type')}>
                        Typ {sortColumn === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'note' ? 'bg-red-700' : ''}`} onClick={() => handleSort('note')}>
                        Poznámka {sortColumn === 'note' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'driverName' ? 'bg-red-700' : ''}`} onClick={() => handleSort('driverName')}>
                        Řidič {sortColumn === 'driverName' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                        <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'maker' ? 'bg-zinc-900' : ''}`}>{result.maker}</td>
                        <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'type' ? 'bg-zinc-900' : ''}`}>{result.type}</td>
                        <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'note' ? 'bg-zinc-900' : ''}`}>{result.note === null || result.note === '' ? 'Není' : result.note}</td>
                        <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'driverName' ? 'bg-zinc-900' : ''}`}>{result.driverName ?? 'Není'} {result.driverSurname ?? ''}</td>
                        <td className="px-6 py-2 whitespace-nowrap">
                            <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()} onClick={() => handleClick(result.id)}>Upravit</button>
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

export default TableOfCars;
