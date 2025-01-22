import NavbarAdmin from '../components/NavbarAdmin';
import CreateSeriesForm from '../components/CreateSeriesForm';

const CreateSeries: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <CreateSeriesForm />
            </div>
        </div>
    );
};

export default CreateSeries;
