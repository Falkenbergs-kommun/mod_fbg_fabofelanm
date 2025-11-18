/**
 * Felanmälan Widget Component
 *
 * Main widget component that wraps ReportForm and ReportStatus
 *
 * NOTE: This file should import the actual components from felanmalan-mock:
 * - ReportForm
 * - ReportStatus
 * - Combobox
 * - Header (optional, can be simplified)
 *
 * Copy these components from felanmalan-mock/components/ and adjust imports
 */

import React, { useState } from 'react';
import { ApiClientProvider } from './apiClient';

/**
 * Placeholder component - Replace with actual ReportForm from felanmalan-mock
 */
function ReportFormPlaceholder({ userData, kundNr }) {
  return (
    <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '1rem' }}>Felanmälan</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Widget laddad! Användare: {userData.name} ({userData.email})
      </p>
      <p style={{ color: '#999', fontSize: '0.875rem' }}>
        TODO: Kopiera ReportForm.tsx, ReportStatus.tsx, och Combobox.tsx från felanmalan-mock/components/
        och konvertera till .jsx format (ta bort TypeScript-typer).
      </p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Steg för att komplettera widget:</strong>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Kopiera components från felanmalan-mock/components/</li>
          <li>Konvertera TypeScript (.tsx) till JavaScript (.jsx)</li>
          <li>Ta bort alla type annotations och interfaces</li>
          <li>Uppdatera import paths till relativa paths</li>
          <li>Ersätt Next.js-specifika hooks (useSearchParams → vanilla JS)</li>
          <li>Importera komponenter här i FelanmalanWidget.jsx</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Main Widget Component
 */
export default function FelanmalanWidget({ apiEndpoint, userData, kundNr, googleMapsApiKey }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedObjekt, setSelectedObjekt] = useState(null);

  return (
    <ApiClientProvider apiEndpoint={apiEndpoint} kundNr={kundNr}>
      <div className="felanmalan-widget">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReportFormPlaceholder
            userData={userData}
            kundNr={kundNr}
            onWorkOrdersLoaded={setWorkOrders}
            onObjektSelected={setSelectedObjekt}
          />

          {/* TODO: Add ReportStatus here */}
          <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Pågående ärenden</h3>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              {workOrders.length} ärenden för {selectedObjekt?.namn || 'ingen fastighet vald'}
            </p>
          </div>
        </div>
      </div>
    </ApiClientProvider>
  );
}
