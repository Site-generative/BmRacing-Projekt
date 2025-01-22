import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './pages/Login';
import CreateRace from './pages/CreateRace';
import EditRace from './pages/EditRace';
import TableSeries from './pages/TableSeries';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CreateSeries from './pages/CreateSeries';
import TableDrivers from './pages/TableDrivers';
import CreateDriver from './pages/CreateDriver';
import TableCars from './pages/TableCars';
import CreateCar from './pages/CreateCar';
import CreateRegistration from './pages/CreateRegistration';
import EditSeries from './pages/EditSeries';
import EditDriver from './pages/EditDriver';
import EditCar from './pages/EditCar';
import EditRegistration from './pages/EditRegistration';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer 
          position="top-right" 
          autoClose={5000} 
          hideProgressBar={false} 
          newestOnTop={false} 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss
          pauseOnHover 
          theme="dark"
          className="custom-toast-container"
        />
        <Routes>
          <Route index element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/create-race"
            element={
              <ProtectedRoute>
                <CreateRace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-race/:id"
            element={
              <ProtectedRoute>
                <EditRace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/table-series"
            element={
              <ProtectedRoute>
                <TableSeries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-series"
            element={
              <ProtectedRoute>
                <CreateSeries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-series/:id"
            element={
              <ProtectedRoute>
                <EditSeries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-driver/:id"
            element={
              <ProtectedRoute>
                <EditDriver />
              </ProtectedRoute>
            }
          />
          <Route
            path="/table-drivers"
            element={
              <ProtectedRoute>
                <TableDrivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-driver"
            element={
              <ProtectedRoute>
                <CreateDriver />
              </ProtectedRoute>
            }
          />
          <Route
            path="/table-cars"
            element={
              <ProtectedRoute>
                <TableCars />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-car"
            element={
              <ProtectedRoute>
                <CreateCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-registration"
            element={
              <ProtectedRoute>
                <CreateRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-car/:id"
            element={
              <ProtectedRoute>
                <EditCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-registration/:id"
            element={
              <ProtectedRoute>
                <EditRegistration />
              </ProtectedRoute>
            }
          />
          <Route 
            path="*" 
            element={<ErrorPage />} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;