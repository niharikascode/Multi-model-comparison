import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Blind from './pages/Blind';
import Stats from './pages/Stats';
import Navbar from './Components/Common/Navbar';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blind" element={<Blind />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;