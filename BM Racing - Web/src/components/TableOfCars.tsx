import { useEffect, useState } from 'react';
import { Car } from '../utils/commonTypes';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface CarWithDriver extends Car {
    driverName?: string;
    driverSurname?: string;
}

const TableOfCars = ({ searchQuery }: { searchQuery: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [cars, setCars] = useState<CarWithDriver[]>([]);
    const navigate = useNavigate();

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
                                return { ...car, driverName: 'Není' };
                            }
                        } else {
                            return { ...car, driverName: 'Není' };
                        }
                    })
                );

                setCars(carsWithDrivers);
            } catch (err) {
                console.error('Error fetching cars:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCarsWithDrivers();
    }, []);

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
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Výrobce</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Typ</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Poznámka</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Řidič</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                            <td className="px-6 py-2 whitespace-nowrap">{result.maker}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.type}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.note === null || result.note === '' ? 'Není' : result.note}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.driverName ?? 'Není'} {result.driverSurname ?? ''}</td>
                            <td className="px-6 py-2 whitespace-nowrap">
                                <button className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()} onClick={() => handleClick(result.id)}>Upravit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfCars;
