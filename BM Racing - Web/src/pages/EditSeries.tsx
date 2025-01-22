import NavbarAdmin from '../components/NavbarAdmin';
import EditSeriesForm from '../components/EditSeriesForm';

const EditSeries: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <EditSeriesForm />
            </div>
        </div>
    );
};

export default EditSeries;
