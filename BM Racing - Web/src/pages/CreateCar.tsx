import NavbarAdmin from '../components/NavbarAdmin';
import CreateCarForm from '../components/CreateCarForm';

const CreateCar: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <CreateCarForm route='/table-cars' />
            </div>
        </div>
    );
};

export default CreateCar;
