import { useEffect, useState } from 'react';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from '../services/api';
import {EventTrainingAndQualificationResults, EventRaceResults} from '../utils/commonTypes';

const TableOfResults = ({ searchQuery, event_id }: { searchQuery: string; event_id: number }) => {
    const [results, setResults] = useState<EventTrainingAndQualificationResults[]>([]);
    const [raceResults, setRaceResults] = useState<EventRaceResults>([]);
    const [selectedPhase, setSelectedPhase] = useState<string>('1');
    const [selectedCategory, setSelectedCategory] = useState<string>('0');
    const [remainingTime, setRemainingTime] = useState(15);

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-amber-500';
            case 1: return 'text-neutral-300';
            case 2: return 'text-yellow-800';
            default: return 'text-white';
        }
    };

    useEffect(() => {
        setResults([]);
        setRaceResults([]);
    
        const fetchResults = async () => {
            try {
                if (selectedPhase === '3') {
                    const response = await api.getEventRaceResults(event_id, Number(selectedPhase));
                    const results = response.data as unknown as EventRaceResults;
                    setRaceResults(results);
                } else {
                    const response = await api.getEventResults(event_id, Number(selectedPhase));
                    const results = response.data as unknown as EventTrainingAndQualificationResults[];
                    setResults(results);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };
    
        fetchResults();
    
        let timeLeft = 15; 
        const interval = setInterval(() => {
            fetchResults();
            timeLeft = 15;
            setRemainingTime(15);
        }, 15000);
    
        const countdown = setInterval(() => {
            timeLeft -= 1;
            setRemainingTime(timeLeft);
        }, 1000);
    
        return () => {
            clearInterval(interval);
            clearInterval(countdown);
        };
    }, [event_id, selectedPhase]);

    const exportToExcel = async () => {
        const wb = XLSX.utils.book_new();
    
        try {
            const [trainingResponse, qualificationResponse, raceResponse] = await Promise.all([
                api.getEventResults(event_id, 1),
                api.getEventResults(event_id, 2),
                api.getEventRaceResults(event_id, 3)
            ]);
    
            const trainingResults = trainingResponse.data as EventTrainingAndQualificationResults[];
            const qualificationResults = qualificationResponse.data as EventTrainingAndQualificationResults[];
            const raceResults = raceResponse.data as EventRaceResults;
    
            const groupByCategory = (results: EventTrainingAndQualificationResults[]) => {
                return results.reduce((acc, result) => {
                    if (!acc[result.car_class]) {
                        acc[result.car_class] = [];
                    }
                    acc[result.car_class].push(result);
                    return acc;
                }, {} as Record<string, EventTrainingAndQualificationResults[]>);
            };
    
            const autoFitColumns = (ws: XLSX.WorkSheet, sheetData: any[][]) => {
                const colWidths = sheetData[3].map((_, colIndex) => {
                    let maxLength = 10;
                
                    sheetData.forEach(row => {
                        const cellValue = row[colIndex];
                        if (cellValue !== undefined && cellValue !== null) {
                            const cellLength = cellValue.toString().length;
                            maxLength = Math.max(maxLength, cellLength + 2);
                        }
                    });
                
                    return { wch: maxLength };
                });
            
                ws['!cols'] = colWidths;
            };
    
            const trainingSheetData: any[][] = [["Trénink"], ["Pozice", "Body", "#", "Jméno", "Auto", "Kategorie", "Nejlepší kolo"]];
            const groupedTraining = groupByCategory(trainingResults);
            Object.entries(groupedTraining).forEach(([category, results]) => {
                trainingSheetData.push([category]);
                trainingSheetData.push(...results.map(result => [
                    result.position, result.points, result.number, 
                    `${result.name} ${result.surname}`, result.car, 
                    result.car_class, result.best_lap
                ]));
            });
            const trainingSheet = XLSX.utils.aoa_to_sheet(trainingSheetData);
            autoFitColumns(trainingSheet, trainingSheetData);
            XLSX.utils.book_append_sheet(wb, trainingSheet, "Trénink");
    
            const qualificationSheetData: any[][] = [["Kvalifikace"], ["Pozice", "Body", "#", "Jméno", "Auto", "Kategorie", "Nejlepší kolo"]];
            const groupedQualification = groupByCategory(qualificationResults);
            Object.entries(groupedQualification).forEach(([category, results]) => {
                qualificationSheetData.push([category]);
                qualificationSheetData.push(...results.map(result => [
                    result.position, result.points, result.number, 
                    `${result.name} ${result.surname}`, result.car, 
                    result.car_class, result.best_lap
                ]));
            });
            const qualificationSheet = XLSX.utils.aoa_to_sheet(qualificationSheetData);
            autoFitColumns(qualificationSheet, qualificationSheetData);
            XLSX.utils.book_append_sheet(wb, qualificationSheet, "Kvalifikace");
    
            const raceSheetData = [
                ["Závod"],
                ["Pozice", "Body", "#", "Jméno", "Auto", "Kategorie", "Součet časů", ...Array.from({ length: getMaxLapsExcel(raceResults) }, (_, i) => `Kolo ${i + 1}`)],
                ...raceResults.flatMap(category => [
                    [category.category_name],
                    ...category.results.map(result => [
                        result.position, result.points, result.start_number, result.driver_name, result.car, 
                        category.category_name, formatTotalTime(result.total_time), 
                        ...Array.from({ length: getMaxLapsExcel(raceResults) }, (_, i) => result.lap_times[i] || "-")
                    ]),
                ]),
            ];
            const raceSheet = XLSX.utils.aoa_to_sheet(raceSheetData);
            autoFitColumns(raceSheet, raceSheetData);
            XLSX.utils.book_append_sheet(wb, raceSheet, "Závod");
    
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const data = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(data, `race_results.xlsx`);
        } catch (error) {
            console.error("Error fetching results for export:", error);
        }
    };
    
    const getMaxLapsExcel = (raceResults: EventRaceResults) => {
        return Math.max(...raceResults.flatMap(category => category.results.map(result => result.lap_times.length)));
    };
    
    
    const groupedData = results.reduce((acc, result) => {
        if (!acc[result.car_class]) {
            acc[result.car_class] = [];
        }
        acc[result.car_class].push(result);
        return acc;
    }, {} as Record<string, EventTrainingAndQualificationResults[]>);

    const processedData = Object.entries(groupedData).flatMap(([category, group]) => {
        const sortedGroup = group.sort((a, b) => Number(a.best_lap) - Number(b.best_lap));
        return sortedGroup.map((item, index) => ({ ...item, position: index + 1 }));
    });

    const filteredData = processedData.filter((result) =>
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.number.toString().includes(searchQuery.toLowerCase()) ||
        result.best_lap.toString().includes(searchQuery.toLowerCase()) ||
        result.car_class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.points.toString().includes(searchQuery.toLowerCase()) ||
        result.car.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.position.toString().includes(searchQuery.toLowerCase())
    );

    const getFilteredRaceResults = () => {
        return raceResults
            .filter((category) => selectedCategory === '0' || category.category_name === selectedCategory)
            .map((category) => ({
                ...category,
                results: category.results.filter((result) =>
                    result.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    result.car.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    result.start_number.toString().includes(searchQuery.toLowerCase()) ||
                    result.total_time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
                ),
            }))
            .filter((category) => category.results.length > 0);
    };

    const renderTrainingAndQualificationTable = () => (
        <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
            <thead className="bg-red-600">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Pozice</th>
                    {selectedPhase === '2' && (
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Body</th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-500">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Jméno</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Auto</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Kategorie</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg bg-green-600">Nejlepší kolo</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-gray-200">
                {filteredData.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center">
                            Nejsou dostupné žádné výsledky
                        </td>
                    </tr>
                ) : (
                    Object.entries(groupedData).flatMap(([category, group]) => {
                        if (selectedCategory !== "0" && selectedCategory !== category) return null;
                        
                        const filteredGroup = group.filter((result) =>
                            result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.number.toString().includes(searchQuery.toLowerCase()) ||
                            result.best_lap.toString().includes(searchQuery.toLowerCase()) ||
                            result.points.toString().includes(searchQuery.toLowerCase()) ||
                            result.car_class.toLowerCase().includes(searchQuery.toLowerCase())
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
                                <tr key={`${category}-${index}`} className={`bg-zinc-800 text-white`}>
                                    <td className={`px-6 py-2 whitespace-nowrap font-bold ${getMedalColor(result.position - 1)}`}>
                                        {result.position}
                                    </td>
                                    {selectedPhase === '2' && (
                                        <td className="px-6 py-2 whitespace-nowrap">{result.points}</td>
                                    )}
                                    <td className="px-6 py-2 whitespace-nowrap">{result.number}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.name} {result.surname}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.car}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.car_class}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.best_lap}</td>
                                </tr>
                            )),
                        ];
                    })
                )}
            </tbody>
        </table>
    );

    const getMaxLaps = () => {
        return Math.max(
            ...raceResults.flatMap((category) =>
                category.results.map((result) => result.lap_times.length)
            )
        );
    };

    const formatTotalTime = (time: string) => {
        const [main, fraction] = time.split('.');
        return fraction ? `${main}.${fraction.slice(0, 2)}` : main;
    };

    const renderRaceTable = () => {
        const maxLaps = getMaxLaps();
        const filteredRaceResults = getFilteredRaceResults();
    
        return (
            <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                <thead className="bg-red-600">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Pozice</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Body</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider bg-blue-500">#</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Jméno</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Auto</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Kategorie</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600">Součet časů</th>
                        {Array.from({ length: maxLaps }, (_, i) => (
                            <th key={`lap-${i}`} className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredRaceResults.length === 0 ? (
                        <tr>
                            <td colSpan={8 + maxLaps} className="text-center">
                                Nejsou dostupné žádné výsledky
                            </td>
                        </tr>
                    ) : (
                        filteredRaceResults.flatMap((category) => [
                            <tr key={`category-${category.category_id}`} className="bg-yellow-400 h-4">
                                <td colSpan={8 + maxLaps} className="text-left text-lg font-semibold py-1 pl-6">
                                    {category.category_name}
                                </td>
                            </tr>,
                            ...category.results.map((result, index) => (
                                <tr key={`result-${category.category_id}-${index}`} className="bg-zinc-800 text-white">
                                    <td className={`px-6 py-2 whitespace-nowrap font-bold ${getMedalColor(result.position - 1)}`}>
                                        {result.position}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.points}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.start_number}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.driver_name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{result.car}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">{category.category_name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap bg-zinc-900">{formatTotalTime(result.total_time)}</td>
                                    {Array.from({ length: maxLaps }, (_, i) => {
                                        const bestLapTime = Math.min(...result.lap_times.map((lap) => parseFloat(lap.replace(/:/g, ''))));
                                        const currentLapTime = result.lap_times[i] ? parseFloat(result.lap_times[i].replace(/:/g, '')) : null;

                                        return (
                                            <td
                                                key={`lap-${index}-${i}`}
                                                className={`px-6 py-2 whitespace-nowrap ${
                                                    currentLapTime === bestLapTime ? 'text-green-500' : ''
                                                }`}
                                            >
                                                {result.lap_times[i] || '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )),
                        ])
                    )}
                </tbody>
            </table>
        );
    };

    const getCategories = () => {
        if (selectedPhase === '3') {
            return raceResults.map((category) => category.category_name);
        } else {
            return Object.keys(groupedData);
        }
    };

    return (
        <div className="px-4 h-3/4 sm:h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
                <select
                    name="phase"
                    id="phase"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="custom-select rounded-full border border-red-600 pl-3 pr-7 py-1 focus:outline-none focus:border-red-600 bg-white text-l font-normal mb-2 sm:mb-0 sm:flex-grow"
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
                    className="custom-select rounded-full border border-red-600 pl-3 pr-7 py-1 focus:outline-none focus:border-red-600 bg-white text-l font-normal mb-2 sm:mb-0 sm:flex-grow"
                >
                    <option value="0">Všechny kategorie</option>
                    {getCategories().map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <button
                    onClick={exportToExcel}
                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-1 rounded-full mb-2 sm:mb-0 sm:flex-grow"
                >
                    Exportovat do Excelu
                </button>
                <span className="text-sm text-gray-600 sm:ml-4">
                    Aktualizace za: {remainingTime} s
                </span>
            </div>
            <div className="h-full max-h-[40vh] sm:max-h-[45vh] overflow-y-scroll overflow-x-auto rounded-lg">
                {selectedPhase === '3' ? renderRaceTable() : renderTrainingAndQualificationTable()}
            </div>
        </div>
    );
};    

export default TableOfResults;