import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const Index = () => {
  const [file, setFile] = useState<string>('');

  useEffect(() => {
    // Fetch the file from the public folder
    fetch('/data.xlsx') // Replace with your file's name
      .then((response) => response.blob())
      .then((blob) => {
        const fileUrl = URL.createObjectURL(blob);
        setFile(fileUrl); // Set the file URL to state
      })
      .catch((error) => {
        console.error('Error loading the file:', error);
      });
  }, []);

  return (
    <StrictMode>
      <App file={file} />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Index />);
