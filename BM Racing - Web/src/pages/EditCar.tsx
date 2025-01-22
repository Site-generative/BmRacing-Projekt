import NavbarAdmin from '../components/NavbarAdmin';
import EditCarForm from '../components/EditCarForm';

const EditCar: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <EditCarForm />
            </div>
        </div>
    );
};

export default EditCar;
