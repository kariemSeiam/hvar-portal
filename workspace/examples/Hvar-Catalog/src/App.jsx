import React from 'react';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './components/pages/LandingPage';

const App = () => {
  return (
    <AppShell>
      <LandingPage />
    </AppShell>
  );
};

export default App;