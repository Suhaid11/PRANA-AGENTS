import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import { EmergencyProvider } from './context/EmergencyContext';
import { useEmergency } from './context/useEmergency';
import { PranaShell } from './components/shell/PranaShell';
import { MissionPortal } from './components/portal/MissionPortal';
import { AmbulanceWorkspace } from './components/ambulance/AmbulanceWorkspace';
import { ClinicianWorkspace } from './components/clinician/ClinicianWorkspace';
import { HospitalCommand } from './components/hospital/HospitalCommand';
import { MedicalReadiness } from './components/readiness/MedicalReadiness';
import { DemoDirector } from './components/shell/DemoDirector';

const AppContent: React.FC = () => {
  const { activeRole, appMode } = useEmergency();

  return (
    <>
      <PranaShell>
        {activeRole === 'PORTAL' && <MissionPortal />}
        {activeRole === 'FIELD_MEDIC' && <AmbulanceWorkspace />}
        {activeRole === 'REMOTE_CLINICIAN' && <ClinicianWorkspace />}
        {activeRole === 'HOSPITAL_COMMAND' && <HospitalCommand />}
        {activeRole === 'READINESS' && <MedicalReadiness />}
      </PranaShell>
      {appMode === 'DEMO' && <DemoDirector />}
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <EmergencyProvider>
        <AppContent />
      </EmergencyProvider>
    </AuthProvider>
  );
}

export default App;
