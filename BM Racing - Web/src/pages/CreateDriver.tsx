import NavbarAdmin from '../components/NavbarAdmin';
import CreateDriverForm from '../components/CreateDriverForm';

const CreateDriver: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20 px-6 sm:px-0'>
                <CreateDriverForm route="/table-drivers" onDriverCreated={() => {}}/>
            </div>
        </div>
    );
};

export default CreateDriver;
