import React from 'react';

export default function ReportStatus({ workOrders, selectedObjekt }) {
  const getStatusText = (status) => {
    const statusMap = {
      'PAGAR': 'Pågår',
      'REG': 'Registrerad',
      'GODK': 'Godkänd',
      'AVSL': 'Avslutad'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PAGAR': 'bg-blue-100 text-blue-800',
      'REG': 'bg-yellow-100 text-yellow-800',
      'GODK': 'bg-green-100 text-green-800',
      'AVSL': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Pågående ärenden</h2>

      {!selectedObjekt && (
        <div className="text-center py-8 text-gray-500">
          <p>Välj en fastighet för att se pågående ärenden</p>
        </div>
      )}

      {selectedObjekt && workOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Inga pågående ärenden för {selectedObjekt.namn}</p>
        </div>
      )}

      {selectedObjekt && workOrders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {workOrders.length} ärende{workOrders.length !== 1 ? 'n' : ''} för <strong>{selectedObjekt.namn}</strong>
          </p>

          {workOrders.map((order) => (
            <div
              key={order.arbetsorderId || order.id}
              className="border border-gray-200 rounded-md p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-gray-900">
                    #{order.arbetsorderId || order.id}
                  </span>
                  {order.status && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  )}
                </div>
                {order.registreradDatum && (
                  <span className="text-xs text-gray-500">
                    {new Date(order.registreradDatum).toLocaleDateString('sv-SE')}
                  </span>
                )}
              </div>

              {order.beskrivning && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                  {order.beskrivning}
                </p>
              )}

              {order.arbetsordertypKod && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {order.arbetsordertypKod === 'F' ? 'Felanmälan' : 'Beställning'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
