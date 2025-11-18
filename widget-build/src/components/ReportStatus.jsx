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
      'PAGAR': 'uk-badge uk-label-primary',
      'REG': 'uk-badge uk-label-warning',
      'GODK': 'uk-badge uk-label-success',
      'AVSL': 'uk-badge'
    };
    return colorMap[status] || 'uk-badge';
  };

  return (
    <div className="uk-card uk-card-default uk-card-body">
      <h2 className="uk-heading-small uk-margin">Pågående ärenden</h2>

      {!selectedObjekt && (
        <div className="uk-text-center uk-padding uk-text-muted">
          <p>Välj en fastighet för att se pågående ärenden</p>
        </div>
      )}

      {selectedObjekt && workOrders.length === 0 && (
        <div className="uk-text-center uk-padding uk-text-muted">
          <p>Inga pågående ärenden för {selectedObjekt.namn}</p>
        </div>
      )}

      {selectedObjekt && workOrders.length > 0 && (
        <div>
          <p className="uk-text-small uk-text-muted uk-margin">
            {workOrders.length} ärende{workOrders.length !== 1 ? 'n' : ''} för <strong>{selectedObjekt.namn}</strong>
          </p>

          {workOrders.map((order) => (
            <div
              key={order.arbetsorderId || order.id}
              className="uk-card uk-card-default uk-card-body uk-card-hover uk-margin"
            >
              <div className="uk-flex uk-flex-between uk-flex-top uk-margin-small-bottom">
                <div>
                  <span className="uk-text-bold">
                    #{order.arbetsorderId || order.id}
                  </span>
                  {order.status && (
                    <span className={`uk-margin-small-left ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  )}
                </div>
                {order.registreradDatum && (
                  <span className="uk-text-meta">
                    {new Date(order.registreradDatum).toLocaleDateString('sv-SE')}
                  </span>
                )}
              </div>

              {order.beskrivning && (
                <p className="uk-text-small uk-margin-small-top" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {order.beskrivning}
                </p>
              )}

              {order.arbetsordertypKod && (
                <div className="uk-margin-small-top">
                  <span className="uk-text-meta">
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
