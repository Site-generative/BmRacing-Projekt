import { useEffect, useState } from 'react';
import api from '../services/api';
import {SeriesDriverResults} from '../utils/commonTypes';

const TableOfSeriesResults = ({ searchQuery, series_id }: { searchQuery: string; series_id: number }) => {
    const [results, setResults] = useState<SeriesDriverResults>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Všechny kategorie');
    const [availableCategories, setAvailableCategories] = useState<{ [key: string]: boolean }>({
        'Všechny kategorie': true,
        'S1+': false,
        'S1': false,
        'S2': false,
        'S3': false,
        'S4': false,
        'S5': false,
        'S6': false,
    });
    const [filteredResults, setFilteredResults] = useState<SeriesDriverResults>([]);



    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-amber-500';
            case 1: return 'text-neutral-300';
            case 2: return 'text-yellow-800';
            default: return 'text-white';
        }
    };

    useEffect(() => {
        api.getSeriesResults(series_id)
            .then((response) => {
                const fetchedResults = response.data as unknown as SeriesDriverResults;
                setResults(fetchedResults);
                setFilteredResults(fetchedResults);

                const updatedCategories = { ...availableCategories };
                fetchedResults.forEach((category) => {
                    if (category.drivers.length > 0) {
                        updatedCategories[category.category] = true;
                    } else {
                        updatedCategories[category.category] = false;
                    }
                });
                setAvailableCategories(updatedCategories);
            })
            .catch((error) => {
                console.error('Error fetching results:', error);
            });
            // eslint-disable-next-line
    }, [series_id]);

    useEffect(() => {
        const filteredByCategory = selectedCategory === 'Všechny kategorie'
            ? results
            : results.filter((category) => category.category === selectedCategory);
    
        const filteredData = filteredByCategory
            .map((category) => ({
                ...category,
                drivers: category.drivers.filter((driver: any) =>
                    driver.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    driver.race_number.toString().includes(searchQuery.toString()) ||
                    driver.total_points.toString().includes(searchQuery.toString()) ||
                    driver.car.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.category.toLowerCase().includes(searchQuery.toLowerCase())
                ),
            }))
            .filter((category) => category.drivers.length > 0);
    
        setFilteredResults(filteredData);
    }, [selectedCategory, searchQuery, results]);
    

  
    const raceColumns = Array.from(
        new Set(
            results.flatMap((category) =>
                category.drivers.flatMap((driver: any) => Object.keys(driver.races))
            )
        )
    );

    return (
        <div className="px-4 h-3/4 sm:h-full">
            <div className="flex flex-col sm:flex-row items-center mb-4">
                <select
                    name="category"
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="custom-select rounded-full border border-red-600 pl-3 pr-7 py-1 focus:outline-none focus:border-red-600 bg-white text-l font-normal ml-3"
                >
                    {Object.keys(availableCategories).map((categoryName) => (
                        <option
                            key={categoryName}
                            value={categoryName}
                            disabled={!availableCategories[categoryName]}
                        >
                            {categoryName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="h-full max-h-[45vh] overflow-y-scroll overflow-x-auto rounded-lg">
                <table className="w-full table-auto font-body">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                            <th className="px-6 py-4 text-xs font-medium text-white uppercase tracking-wider bg-red-700 rounded-t-lg text-center" colSpan={6}>Body</th>
                        </tr>
                        <tr className='bg-red-600'>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Pozice</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Jméno</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Auto</th>

                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider bg-red-700">Součet</th>
                            {raceColumns.map((race, index) => (
                                <th key={index} className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">{race}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200 border-separate" style={{ borderSpacing: '0 3px' }}>
                        {filteredResults.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="text-center">
                                    Nejsou dostupné žádné výsledky
                                </td>
                            </tr>
                        ) : (
                            filteredResults.map((category, categoryIndex) => {
                                return [
                                    <tr key={`spacer-${category.category}`} className="bg-yellow-400 h-4">
                                        <td colSpan={10} className="text-center text-lg font-semibold py-1">
                                            {category.category}
                                        </td>
                                    </tr>,
                                    category.drivers.map((driver, driverIndex) => (
                                        <tr key={`${categoryIndex}-${driverIndex}`} className="bg-zinc-800 text-white">
                                            <td className={`px-6 py-2 whitespace-nowrap ${getMedalColor(driverIndex)}`}>{driverIndex + 1}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{driver.race_number}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{driver.driver_name}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{driver.car}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{driver.total_points}</td>
                                            {raceColumns.map((race) => (
                                                <td key={race} className="px-6 py-2 whitespace-nowrap">
                                                    {driver.races[race] !== undefined ? driver.races[race] : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )),
                                ];
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};    

export default TableOfSeriesResults;