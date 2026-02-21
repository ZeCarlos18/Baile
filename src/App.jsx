import { BrowserRouter, Routes, Route } from "react-router-dom"
import { RoomProvider } from "./contexts/RoomContext"
import Home from "./pages/Home"
import Room from "./pages/Room"

function App() {
  return (
    <RoomProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  )
}

export default App