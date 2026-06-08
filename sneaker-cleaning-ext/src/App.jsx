import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BookingWizard from './components/BookingWizard/BookingWizard.jsx';
import './index.css';
import { SNEAKER_PLACEHOLDER_SRC } from './utils/assets.js';

function App() {
  return (
    <div className="app">
      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar closeOnClick />
      <BookingWizard />
    </div>
  );
}

export default App;
