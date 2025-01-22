import Navbar from '../components/Navbar';
import NavbarAdmin from '../components/NavbarAdmin';
import { useAuth } from '../contexts/AuthContext';

export default function ErroPage() {
    const { isAuthenticated } = useAuth();
    
    return (
        <div className="min-h-screen bg-stone-100">
            {isAuthenticated ? <NavbarAdmin /> : <Navbar />}
            <div className='h-screen w-screen flex items-center justify-center flex-col'>
                <h1 className='font-body text-9xl font-medium p-4'>404</h1>
                <h2 className='font-body text-xl'>Stránka nebyla nalezena</h2>
            </div>
        </div>
    )
}