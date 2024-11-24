import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Typography, Box, Card, CardMedia, CardContent, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const custTheme = createTheme({
  palette: {
    primary: {
      main: '#500000',
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
      color: '#500000',
      fontSize: 'clamp(1.5rem, 2vw, 2.5rem)', // Responsive font size
    },
    body1: {
      fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', // Responsive font size
      color: '#500000',
    },
    button: {
      fontSize: '1.1rem',
    },
  },
});

export default function Resultspage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, timestamp } = location.state || {};

  const [results] = useState(
    imageUrl
      ? [{ imageUrl, timestamp: timestamp || new Date().toISOString() }]
      : []
  );

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
            maxWidth: '600px',
            width: '100%',
            padding: 3,
          }}
        >
          <IconButton
            sx={{ position: 'absolute', top: 10, left: 10 }}
            onClick={() => navigate('/homepage')}
            color="primary"
          >
            <ArrowBackIcon fontSize="large" />
          </IconButton>

          <Typography variant="h4" sx={{ mb: 2 }}>
            ASL Prediction Results
          </Typography>
          <Box sx={{ width: '100%', height: '3px', backgroundColor: '#500000', mb: 3 }} />

          <Grid container spacing={3} justifyContent="center">
            {results.length > 0 ? (
              results.map((result, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    sx={{
                      width: '100%',
                      maxWidth: '400px',
                      margin: 'auto',
                      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
                      borderRadius: 2,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="350" 
                      image={result.imageUrl} 
                      alt="Uploaded Prediction Result"
                      sx={{
                        objectFit: 'contain', // Fit the entire image within the card
                        backgroundColor: '#F5F5F5',
                      }}
                    />
                    <CardContent>
                      <Typography variant="body2">
                        {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body1" sx={{ mt: 4 }}>No images uploaded</Typography>
            )}
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
