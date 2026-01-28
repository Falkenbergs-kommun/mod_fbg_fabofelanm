import React, { useState } from 'react';

export default function ReportStatus({ workOrders, selectedObjekt }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
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
              key={order.id}
              className="uk-card uk-card-default uk-card-body uk-card-hover uk-margin"
              onClick={() => handleOrderClick(order)}
              style={{ cursor: 'pointer' }}
            >
              <div className="uk-flex uk-flex-between uk-flex-top uk-margin-small-bottom">
                <div>
                  <span className="uk-text-bold">
                    #{order.id}
                  </span>
                  {order.status?.statusKod && (
                    <span className={`uk-margin-small-left ${getStatusColor(order.status.statusKod)}`}>
                      {getStatusText(order.status.statusKod)}
                    </span>
                  )}
                </div>
                {order.registrerad?.datumRegistrerad && (
                  <span className="uk-text-meta">
                    {order.registrerad.datumRegistrerad}
                  </span>
                )}
              </div>

              {order.information?.beskrivning && (
                <p className="uk-text-small uk-margin-small-top" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {order.information.beskrivning}
                </p>
              )}

              <div className="uk-margin-small-top uk-text-meta">
                {order.arbetsorderTyp?.arbetsordertypKod && (
                  <span className="uk-margin-small-right">
                    {order.arbetsorderTyp.arbetsordertypKod === 'F' ? 'Felanmälan' : 'Beställning'}
                  </span>
                )}
                {order.anmalare?.namn && (
                  <span>
                    • Anmälare: {order.anmalare.namn}
                  </span>
                )}
              </div>

              <div className="uk-text-right uk-margin-small-top">
                <button
                  className="uk-button uk-button-primary uk-button-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrderClick(order);
                  }}
                  aria-label={`Visa detaljer för ärende ${order.id}`}
                >
                  Visa detaljer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for work order details */}
      {selectedOrder && (
        <div
          className="uk-modal uk-open"
          style={{ display: 'block' }}
          onClick={closeModal}
        >
          <div
            className="uk-modal-dialog uk-modal-body"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <button
              className="uk-modal-close-default"
              type="button"
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>

            <h2 className="uk-modal-title">
              Ärende #{selectedOrder.id}
              {selectedOrder.status?.statusKod && (
                <span className={`uk-margin-small-left ${getStatusColor(selectedOrder.status.statusKod)}`}>
                  {getStatusText(selectedOrder.status.statusKod)}
                </span>
              )}
            </h2>

            <div className="uk-margin">
              <dl className="uk-description-list">
                {selectedOrder.arbetsorderTyp?.arbetsordertypKod && (
                  <>
                    <dt className="uk-text-bold">Typ</dt>
                    <dd className="uk-margin-small-bottom">
                      {selectedOrder.arbetsorderTyp.arbetsordertypKod === 'F' ? 'Felanmälan' : 'Beställning'}
                    </dd>
                  </>
                )}

                {selectedOrder.registrerad?.datumRegistrerad && (
                  <>
                    <dt className="uk-text-bold">Registrerad</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.registrerad.datumRegistrerad}</dd>
                  </>
                )}

                {selectedOrder.anmalare?.namn && (
                  <>
                    <dt className="uk-text-bold">Anmälare</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.anmalare.namn}</dd>
                  </>
                )}

                {selectedOrder.anmalare?.telefon && (
                  <>
                    <dt className="uk-text-bold">Telefon</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.anmalare.telefon}</dd>
                  </>
                )}

                {selectedOrder.anmalare?.epostAdress && (
                  <>
                    <dt className="uk-text-bold">E-post</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.anmalare.epostAdress}</dd>
                  </>
                )}

                {selectedOrder.objekt?.objektNamn && (
                  <>
                    <dt className="uk-text-bold">Fastighet</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.objekt.objektNamn}</dd>
                  </>
                )}

                {selectedOrder.utrymme?.utrymmesNamn && (
                  <>
                    <dt className="uk-text-bold">Utrymme</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.utrymme.utrymmesNamn}</dd>
                  </>
                )}

                {selectedOrder.enhet?.enhetsNamn && (
                  <>
                    <dt className="uk-text-bold">Enhet</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.enhet.enhetsNamn}</dd>
                  </>
                )}

                {selectedOrder.information?.beskrivning && (
                  <>
                    <dt className="uk-text-bold">Beskrivning</dt>
                    <dd className="uk-margin-small-bottom" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedOrder.information.beskrivning}
                    </dd>
                  </>
                )}

                {selectedOrder.ursprung && (
                  <>
                    <dt className="uk-text-bold">Ursprung</dt>
                    <dd className="uk-margin-small-bottom">{selectedOrder.ursprung}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="uk-text-right uk-margin-top">
              <button
                className="uk-button uk-button-default"
                type="button"
                onClick={closeModal}
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {selectedOrder && (
        <div
          className="uk-modal-page"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
