import { useEffect, useState } from 'react';
import api from '../services/api';
import {EventResults} from '../utils/commonTypes';

const TableOfResults = ({ searchQuery, event_id }: { searchQuery: string; event_id: number }) => {
    const [results, setResults] = useState<EventResults[]>([]);
    const [selectedPhase, setSelectedPhase] = useState<string>('1');
    const [selectedCategory, setSelectedCategory] = useState<string>('0');

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-amber-500';
            case 1: return 'text-neutral-300';
            case 2: return 'text-yellow-800';
            default: return 'text-white';
        }
    };

    useEffect(() => {
        api.getEventResults(event_id, Number(selectedPhase))
            .then((response) => {
                const results = response.data as unknown as EventResults[];
                console.log('Results:', results);
                setResults(results);
            })
            .catch((error) => {
                console.error('Error fetching results:', error);
            });
    }, [event_id, selectedPhase]);

    const groupedData = results.reduce((acc, result) => {
        if (!acc[result.category_name]) {
            acc[result.category_name] = [];
        }
        acc[result.category_name].push(result);
        return acc;
    }, {} as Record<string, EventResults[]>);

    const processedData = Object.entries(groupedData).flatMap(([category, group]) => {
        const sortedGroup = group.sort((a, b) => Number(a.total_time) - Number(b.total_time));
        return sortedGroup.map((item, index) => ({ ...item, position: index + 1 }));
    });

    const filteredData = processedData.filter((result) =>
        result.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.driver_surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.number.toString().includes(searchQuery.toString()) ||
        result.total_time.toString().includes(searchQuery.toString()) ||
        result.points.toString().includes(searchQuery.toString()) ||
        result.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="px-4 h-3/4 sm:h-full">
            <div className="flex flex-col sm:flex-row items-center mb-4">
                <select
                    name="phase"
                    id="phase"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="custom-select rounded-full border border-red-600 pl-3 pr-7 py-1 focus:outline-none focus:border-red-600 bg-white text-l font-normal"
                >
                    <option value="1">Trénink</option>
                    <option value="2">Kvalifikace</option>
                    <option value="3">Závod</option>
                </select>
                <select
                    name="category"
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="custom-select rounded-full border border-red-600 pl-3 pr-7 py-1 focus:outline-none focus:border-red-600 bg-white text-l font-normal ml-3"
                >
                    <option value="0">Všechny kategorie</option>
                    {Object.keys(groupedData).map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                    {["S1", "S2", "S3", "S4", "S5", "S6"].map((category) => (
                        !groupedData[category] && (
                            <option key={category} value={category} disabled>
                                {category}
                            </option>
                        )
                    ))}
                </select>
            </div>
            <div className="h-full max-h-[45vh] overflow-y-scroll overflow-x-auto rounded-lg">
                <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                    <thead className="bg-red-600">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">#</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Jméno</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Příjmení</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Startovní číslo</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Čas</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Body</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Pozice</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg">Kategorie</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center">
                                    Nejsou dostupné žádné výsledky
                                </td>
                            </tr>
                        ) : (
                            Object.entries(groupedData).flatMap(([category, group]) => {
                                if (selectedCategory !== "0" && selectedCategory !== category) return null;
                                
                                const filteredGroup = group.filter((result) =>
                                    result.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    result.driver_surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    result.number.toString().includes(searchQuery.toLowerCase()) ||
                                    result.total_time.toString().includes(searchQuery.toLowerCase()) ||
                                    result.points.toString().includes(searchQuery.toLowerCase()) ||
                                    result.category_name.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                if (filteredGroup.length === 0) {
                                    return [];
                                }

                                return [
                                    <tr key={`spacer-${category}`} className="bg-yellow-400 h-4">
                                        <td colSpan={8} className="text-center text-lg font-semibold py-1">
                                            {category}
                                        </td>
                                    </tr>,
                                    ...filteredGroup.map((result, index) => (
                                        <tr key={`${category}-${index}`} className={`bg-zinc-800 text-white ${result.dnf === true ? 'relative' : ''}`}>
                                            <td className={`px-6 py-2 whitespace-nowrap font-bold ${getMedalColor(result.position - 1)}`}>
                                                {result.position}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.driver_name}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.driver_surname}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.number}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.total_time}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.points}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.position}</td>
                                            <td className="px-6 py-2 whitespace-nowrap">{result.category_name}</td>
                                            {result.dnf === true && selectedPhase === '3' && (
                                                <div className="absolute inset-0 bg-red-800 opacity-80 flex items-center justify-center">
                                                    <span className="text-white font-bold">DNF</span>
                                                </div>
                                            )}
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

export default TableOfResults;