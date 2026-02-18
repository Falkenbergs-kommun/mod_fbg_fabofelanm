import React, { useState, useEffect } from 'react';
import { ApiClientProvider, useApiClient } from './apiClient.jsx';
import ReportForm from './components/ReportForm';
import ReportStatus from './components/ReportStatus';

function FelanmalanWidgetInner({ userData, kundNr }) {
  const apiClient = useApiClient();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedObjekt, setSelectedObjekt] = useState(null);
  const [myWorkOrders, setMyWorkOrders] = useState([]);

  // Load user's work orders on mount
  useEffect(() => {
    loadMyWorkOrders();
  }, []);

  const loadMyWorkOrders = async () => {
    try {
      const orders = await apiClient.listMyWorkOrders();
      setMyWorkOrders(orders);
    } catch (error) {
      console.error('Error loading user work orders:', error);
      setMyWorkOrders([]);
    }
  };

  return (
    <div className="felanmalan-widget">
      <div className="uk-grid-large uk-child-width-1-1 uk-child-width-1-2@m" data-uk-grid>
        <div>
          <ReportForm
            userData={userData}
            kundNr={kundNr}
            onWorkOrdersLoaded={setWorkOrders}
            onObjektSelected={setSelectedObjekt}
            onWorkOrderCreated={loadMyWorkOrders}
          />
        </div>
        <div>
          <ReportStatus
            workOrders={workOrders}
            selectedObjekt={selectedObjekt}
            myWorkOrders={myWorkOrders}
          />
        </div>
      </div>
    </div>
  );
}

export default function FelanmalanWidget({ apiEndpoint, userData, kundId, kundNr }) {
  return (
    <ApiClientProvider apiEndpoint={apiEndpoint} kundId={kundId} kundNr={kundNr}>
      <FelanmalanWidgetInner userData={userData} kundNr={kundNr} />
    </ApiClientProvider>
  );
}
