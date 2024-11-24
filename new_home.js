import React, { useState } from 'react';
import { Button, Typography, CircularProgress, FormControl, Box, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { storage } from '../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ASL from '../components/photos/ASL.png';

const custTheme = createTheme({
  palette: {
    primary: { main: '#500000' },
    secondary: { main: '#FFFFFF' },
  },
  typography: {
    h4: { fontWeight: 'bold', color: '#500000', fontSize: 'clamp(1.5rem, 2vw, 2.5rem)' },
    body1: { fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', color: '#500000' },
    button: { fontSize: '1.1rem' },
  },
});

export default function Homepage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewURL, setPreviewURL] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg')) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
      event.target.value = null;
    } else {
      alert('Please upload a valid PNG or JPEG image');
    }
  };

  const sendToFlaskServer = async (file, imageName) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', imageName);

    try {
      const response = await fetch('https://vocal-completely-shark.ngrok-free.app/predict', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.prediction;
      } else {
        console.error('Flask server error:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error sending to Flask server:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select an image');
      return;
    }

    const imageName = `image_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const fileRef = storageRef(storage, `uploads/${imageName}.jpg`);

    try {
      setLoading(true);
      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      console.log('Image uploaded with name:', imageName);

      // Send image to Flask server for prediction
      const prediction = await sendToFlaskServer(file, imageName);

      setLoading(false);

      if (prediction) {
        navigate('/resultspage', { state: { imageName, imageUrl, prediction } });
      } else {
        alert('Prediction failed or not returned.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error uploading file:', error);
      alert('Failed to upload image');
    }
  };

  return (
    <ThemeProvider theme={custTheme}>
      <Box
        sx={{
          width: '100vw',
          minHeight: '100vh',
          backgroundColor: '#F1F1F1',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: { xs: '100%', md: '800px' },
            width: '100%',
            padding: 3,
          }}
        >
          <IconButton
            sx={{ position: 'absolute', top: 10, right: 10 }}
            onClick={() => navigate('/resultspage')}
            color="primary"
          >
            <ArrowForwardIcon fontSize="large" />
          </IconButton>

          <Typography variant="h4" sx={{ mb: 2 }}>
            ECEN 360 - ASL Fingerspelling - Team 7
          </Typography>
          <Box sx={{ width: '100%', height: '3px', backgroundColor: '#500000', mb: 2 }} />

          <Box
            component="img"
            src={ASL}
            alt="ASL Fingerspelling"
            sx={{
              width: { xs: '90%', md: '90%' },
              maxWidth: '1050px',
              marginBottom: 3,
              borderRadius: '10px',
              boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Typography variant="body2" sx={{ mt: -1, mb: 2 }}>
            * All letters of the alphabet are included except for “j” and “z”
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Please upload an image in PNG or JPEG format to receive a prediction
          </Typography>

          <FormControl sx={{ mb: 3, width: '100%', maxWidth: '300px' }}>
            <Button
              variant="contained"
              component="label"
              color="primary"
              sx={{
                width: '100%',
                color: '#FFFFFF',
                borderRadius: 2,
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              Choose Image
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                hidden
              />
            </Button>
          </FormControl>

          {previewURL && (
            <Box sx={{ mb: 2.5, width: '100%', maxWidth: '300px' }}>
              <img
                src={previewURL}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }}
              />
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={loading}
            sx={{
              width: '100%',
              maxWidth: '300px',
              color: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={25} sx={{ position: 'absolute', color: '#FFFFFF' }} />
                <span style={{ opacity: 0 }}>Uploading...</span>
              </>
            ) : (
              'Upload Image'
            )}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
