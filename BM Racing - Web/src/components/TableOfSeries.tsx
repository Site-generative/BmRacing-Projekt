import { useEffect, useState } from 'react';
import { Series } from '../utils/commonTypes';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import TableOfSeriesResults from './TableOfSeriesResults';

const TableOfSeries = ({ searchQuery }: { searchQuery: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState('year');
  const [sortOrder, setSortOrder] = useState('desc');
  const { isAuthenticated } = useAuth();
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [searchQuery2, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
      const fetchSeries = async () => {
        try {
          const response = await api.getSeries();
          const seriesData = response.data.data;
          const sortedData = seriesData.sort((a:any, b:any) => b.year - a.year);

          setSeries(sortedData);
        } catch (err) {
          console.error('Error fetching series:', err);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchSeries();
    }, []);

    const handleSort = (column: keyof Series) => {
      const order = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortColumn(column);
      setSortOrder(order);
  
      const sortedData = [...series].sort((a, b) => {
        const aValue = (a[column] ?? '').toString().toLowerCase();
        const bValue = (b[column] ?? '').toString().toLowerCase();
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
  
      setSeries(sortedData);
    };

    const filteredData = series.filter((result) =>
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.year.toString().includes(searchQuery)
    );

    const deleteSeries = async (id: number) => {
        try {
          const response = await api.deleteSeries(Number(id));
          if (response.status === 200 || response.status === 204) {
            window.location.reload();
          }
        } catch (error) {
          console.error('Error deleting series', error);
        }
      };
  

    const deleteSeriesPopup = (id: number) => {
        if (window.confirm('Jste si jistý že chcete smazat tuto sérii?')) {
            deleteSeries(id);
            toast.success('Série byla uspěšně smazána!');
        }
    };


    const handleClick = (id:number) => {
      navigate(`/edit-series/${id}`);
      
      window.location.reload();
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };

    const openResults = (id: number) => {
      setSelectedEventId(id);
      setIsResultsOpen(true);
    };

    const handleNameClick = (urlName:string) => {
      navigate(`/table-races/${urlName}`);
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
                    <div className='h-3/4 sm:h-2/3 w-full sm:w-2/3 bg-white rounded-md shadow-lg'>
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
                            <TableOfSeriesResults searchQuery={searchQuery2} series_id={selectedEventId ?? 0}/>
                        </div>
                    </div>
                </div>
            )}
            <table className="w-full table-auto border-separate font-body" style={{ borderSpacing: '0 3px' }}>
                <thead className="bg-red-600">
                    <tr>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer ${sortColumn === 'name' ? 'bg-red-700' : ''}`} onClick={() => handleSort('name')}>
                          Název {sortColumn === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer ${sortColumn === 'year' ? 'bg-red-700' : ''}`} onClick={() => handleSort('year')}>
                          Ročník {sortColumn === 'year' && (sortOrder === 'asc' ? '▲' : '▼')}
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
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                            <td className={`px-6 py-2 whitespace-nowrap hover:text-red-400 hover:cursor-pointer ${sortColumn === 'name' ? 'bg-zinc-900' : ''}`} onClick={() => handleNameClick(result.name)}>{result.name}</td>
                            <td className={`px-6 py-2 whitespace-nowrap ${sortColumn === 'year' ? 'bg-zinc-900' : ''}`}>{result.year}</td>
                            <td className="px-6 py-2 whitespace-nowrap text-center">
                              <button className='bg-blue-500 rounded-full px-4 py-1 hover:bg-blue-600 duration-100 active:bg-blue-700' id={result.id.toString()} onClick={() => openResults(result.id)}>Výsledky</button>
                            </td>
                            {isAuthenticated && (
                                <>
                                  <td className="px-6 py-2 whitespace-nowrap">
                                    <button 
                                      className='bg-green-400 rounded-full px-4 py-1 hover:bg-green-500 duration-100 active:bg-green-700' id={result.id.toString()}
                                      onClick={() => handleClick(result.id)}
                                    >
                                      Upravit
                                    </button>
                                  </td>
                                  <td className="px-6 py-2 whitespace-nowrap">
                                      <button className='bg-red-600 rounded-full px-4 py-1 hover:bg-red-700 duration-100 active:bg-red-800' id={result.id.toString()} onClick={() => deleteSeriesPopup(result.id)}>Smazat</button>
                                  </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfSeries;