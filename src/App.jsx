import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RoomProvider } from './contexts/RoomContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard/:roomId" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App