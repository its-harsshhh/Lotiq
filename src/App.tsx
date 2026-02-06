import { Toaster } from 'sonner';
import { MainLayout } from "./components/MainLayout";

function App() {
  return (
    <>
      <MainLayout />
      <Toaster position="bottom-center" theme="dark" />
    </>
  );
}

export default App;
