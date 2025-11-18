import React, { useState } from 'react';
import { ApiClientProvider } from './apiClient.jsx';
import ReportForm from './components/ReportForm';
import ReportStatus from './components/ReportStatus';

export default function FelanmalanWidget({ apiEndpoint, userData, kundNr, googleMapsApiKey }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedObjekt, setSelectedObjekt] = useState(null);

  return (
    <ApiClientProvider apiEndpoint={apiEndpoint} kundNr={kundNr}>
      <div className="felanmalan-widget">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReportForm
            userData={userData}
            kundNr={kundNr}
            onWorkOrdersLoaded={setWorkOrders}
            onObjektSelected={setSelectedObjekt}
          />
          <ReportStatus
            workOrders={workOrders}
            selectedObjekt={selectedObjekt}
          />
        </div>
      </div>
    </ApiClientProvider>
  );
}
