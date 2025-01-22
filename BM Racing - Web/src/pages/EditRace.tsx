import NavbarAdmin from '../components/NavbarAdmin';
import EditForm from '../components/EditForm';
import { useParams } from 'react-router-dom';

const EditRace: React.FC = () => {
    const { id = null } = useParams<{ id: string }>();

    return (
        <div className="h-screen bg-stone-100 overflow-x-hidden">
            <NavbarAdmin />
            <div className='flex flex-col items-center pt-20'>
                <EditForm id={id}/>
            </div>
        </div>
    );
};

export default EditRace;
