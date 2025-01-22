import NavbarAdmin from '../components/NavbarAdmin';
import CreateConfigurationForm from '../components/CreateConfigurationForm';

const CreateConfiguration: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <CreateConfigurationForm route='/table-registrations' onConfigurationCreated={() => {}}/>
            </div>
        </div>
    );
};

export default CreateConfiguration;
