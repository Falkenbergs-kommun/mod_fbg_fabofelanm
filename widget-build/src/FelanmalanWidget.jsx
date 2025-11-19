import React, { useState } from 'react';
import { ApiClientProvider } from './apiClient.jsx';
import ReportForm from './components/ReportForm';
import ReportStatus from './components/ReportStatus';

export default function FelanmalanWidget({ apiEndpoint, userData, kundId, kundNr }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedObjekt, setSelectedObjekt] = useState(null);

  return (
    <ApiClientProvider apiEndpoint={apiEndpoint} kundId={kundId} kundNr={kundNr}>
      <div className="felanmalan-widget">
        <div className="uk-grid-large uk-child-width-1-1 uk-child-width-1-2@m" data-uk-grid>
          <div>
            <ReportForm
              userData={userData}
              kundNr={kundNr}
              onWorkOrdersLoaded={setWorkOrders}
              onObjektSelected={setSelectedObjekt}
            />
          </div>
          <div>
            <ReportStatus
              workOrders={workOrders}
              selectedObjekt={selectedObjekt}
            />
          </div>
        </div>
      </div>
    </ApiClientProvider>
  );
}
