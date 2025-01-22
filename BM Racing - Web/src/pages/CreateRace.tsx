import NavbarAdmin from '../components/NavbarAdmin';
import CreateForm from '../components/CreateForm';

const CreateRace: React.FC = () => {
    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <CreateForm />
            </div>
        </div>
    );
};

export default CreateRace;
