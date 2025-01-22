import NavbarAdmin from '../components/NavbarAdmin';
import EditRegistrationForm from '../components/EditRegistrationForm';

const EditRegistration: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <EditRegistrationForm />
            </div>
        </div>
    );
};

export default EditRegistration;
