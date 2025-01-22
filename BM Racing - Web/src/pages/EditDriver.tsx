import NavbarAdmin from '../components/NavbarAdmin';
import EditDriverForm from '../components/EditDriverForm';

const EditDriver: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <EditDriverForm />
            </div>
        </div>
    );
};

export default EditDriver;
