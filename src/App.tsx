import React from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { PranaShell } from './components/shell/PranaShell';
import { MissionPortal } from './components/portal/MissionPortal';
import { AmbulanceWorkspace } from './components/ambulance/AmbulanceWorkspace';
import { ClinicianWorkspace } from './components/clinician/ClinicianWorkspace';
import { HospitalCommand } from './components/hospital/HospitalCommand';
import { MedicalReadiness } from './components/readiness/MedicalReadiness';

const AppContent: React.FC = () => {
  const { activeRole } = useEmergency();

  return (
    <PranaShell>
      {activeRole === 'PORTAL' && <MissionPortal />}
      {activeRole === 'FIELD_MEDIC' && <AmbulanceWorkspace />}
      {activeRole === 'REMOTE_CLINICIAN' && <ClinicianWorkspace />}
      {activeRole === 'HOSPITAL_COMMAND' && <HospitalCommand />}
      {activeRole === 'READINESS' && <MedicalReadiness />}
    </PranaShell>
  );
};

export function App() {
  return (
    <EmergencyProvider>
      <AppContent />
    </EmergencyProvider>
  );
}

export default App;
