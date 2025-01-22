import NavbarAdmin from '../components/NavbarAdmin';
import CreateRegistrationForm from '../components/CreateRegistrationForm';

const CreateRegistration: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <CreateRegistrationForm />
            </div>
        </div>
    );
};

export default CreateRegistration;
