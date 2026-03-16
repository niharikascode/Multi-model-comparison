import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Toaster } from 'sonner';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;