import Navbar from '../components/Navbar';
import LoginForm from '../components/LoginForm';

export default function Login() {
    return (
        <div className="min-h-screen bg-stone-100">
            <Navbar />
            <div className='w-screen h-screen flex justify-center items-center relative' style={{ backgroundImage: "url('/images/login-background.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
                <div className="relative">
                    <LoginForm />
                </div>
            </div>
        </div>
    )
}