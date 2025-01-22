import { useEffect, useState } from 'react';
import { Series } from '../utils/commonTypes';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TableOfSeries = ({ searchQuery }: { searchQuery: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [series, setSeries] = useState<Series[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSeries = async () => {
          try {
            const response = await api.getSeries();
            setSeries(response.data.data);
          } catch (err) {
            console.error('Error fetching series:', err);
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchSeries();
      }, []);

    const filteredData = series.filter((result) =>
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.year.toString().includes(searchQuery)
    );

    const deleteSeries = async (id: number) => {
        try {
          const response = await api.deleteSeries(Number(id));
          if (response.status === 200 || response.status === 204) {
            navigate('/table-series');
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
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">Název</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Ročník</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-gray-200">
                    {filteredData.map((result, index) => (
                        <tr key={index} className='bg-zinc-800 text-white'>
                            <td className="px-6 py-2 whitespace-nowrap">{result.name}</td>
                            <td className="px-6 py-2 whitespace-nowrap">{result.year}</td>
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableOfSeries;