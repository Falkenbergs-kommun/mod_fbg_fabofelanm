import React, { useState, useEffect, useRef } from 'react';
import Combobox from './Combobox';
import { useApiClient } from '../apiClient.jsx';
import { getAddressString } from '../lib/fastaStrukturenStore';

export default function ReportForm({ userData, kundNr, onWorkOrdersLoaded, onObjektSelected }) {
  const apiClient = useApiClient();

  // State
  const [objektList, setObjektList] = useState([]);
  const [selectedObjektId, setSelectedObjektId] = useState('');
  const [selectedObjekt, setSelectedObjekt] = useState(null);
  const [isLoadingObjekt, setIsLoadingObjekt] = useState(false);

  const [utrymmesOptions, setUtrymmesOptions] = useState([]);
  const [selectedUtrymmesId, setSelectedUtrymmesId] = useState('');
  const [selectedUtrymme, setSelectedUtrymme] = useState(null);
  const [isLoadingUtrymmen, setIsLoadingUtrymmen] = useState(false);

  const [enheterOptions, setEnheterOptions] = useState([]);
  const [selectedEnhetId, setSelectedEnhetId] = useState('');
  const [selectedEnhet, setSelectedEnhet] = useState(null);
  const [isLoadingEnheter, setIsLoadingEnheter] = useState(false);

  const [orderType, setOrderType] = useState('felanmalan');
  const [refCode, setRefCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  const fileInputRef = useRef(null);

  // Load objekt on mount
  useEffect(() => {
    loadObjektList();
  }, []);

  // Load utrymmen when objekt changes
  useEffect(() => {
    if (selectedObjektId) {
      loadUtrymmen(selectedObjektId);
      loadWorkOrdersForObject(selectedObjektId);
    } else {
      setUtrymmesOptions([]);
      setSelectedUtrymmesId('');
      setSelectedUtrymme(null);
    }
  }, [selectedObjektId]);

  // Load enheter when utrymme changes
  useEffect(() => {
    if (selectedUtrymmesId) {
      loadEnheter(selectedUtrymmesId);
    } else {
      setEnheterOptions([]);
      setSelectedEnhetId('');
      setSelectedEnhet(null);
    }
  }, [selectedUtrymmesId]);

  const loadObjektList = async () => {
    setIsLoadingObjekt(true);
    try {
      const response = await apiClient.listObjekt();
      setObjektList(response.objekt || []);
    } catch (error) {
      console.error('Error loading objekt:', error);
      setSubmitError('Kunde inte ladda fastigheter.');
    } finally {
      setIsLoadingObjekt(false);
    }
  };

  const loadUtrymmen = async (objektId) => {
    setIsLoadingUtrymmen(true);
    try {
      const response = await apiClient.listUtrymmen(objektId);
      setUtrymmesOptions(response.utrymmen || []);
    } catch (error) {
      console.error('Error loading utrymmen:', error);
      setUtrymmesOptions([]);
    } finally {
      setIsLoadingUtrymmen(false);
    }
  };

  const loadEnheter = async (utrymmesId) => {
    setIsLoadingEnheter(true);
    try {
      const response = await apiClient.listEnheter(utrymmesId);
      setEnheterOptions(response.enheter || []);
    } catch (error) {
      console.error('Error loading enheter:', error);
      setEnheterOptions([]);
    } finally {
      setIsLoadingEnheter(false);
    }
  };

  const loadWorkOrdersForObject = async (objektId) => {
    try {
      const response = await apiClient.listWorkOrdersForObject(objektId);
      if (onWorkOrdersLoaded) {
        onWorkOrdersLoaded(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
      if (onWorkOrdersLoaded) onWorkOrdersLoaded([]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError('');

    if (selectedFiles.length > 5) {
      setFileError('Max 5 filer kan laddas upp');
      return;
    }

    const maxSize = 4 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        setFileError(`Filen "${file.name}" är för stor (max 4MB)`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setFileError(`Filen "${file.name}" har ogiltigt format`);
        return;
      }
    }

    setFiles(selectedFiles);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedObjekt) {
      setSubmitError('Vänligen välj en fastighet');
      return;
    }

    if (orderType === 'bestallning' && !refCode.trim()) {
      setSubmitError('Vänligen ange referenskod för beställning');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Vänligen beskriv felet');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const cleanPhone = (phoneStr) => phoneStr.replace(/[^\d]/g, '');

      const contactIsDifferent =
        contactPerson !== userData?.name ||
        phone !== userData?.phone ||
        email !== userData?.email;

      let finalDescription = description;

      if (orderType === 'bestallning' && refCode.trim()) {
        finalDescription += `\n\nReferenskod: ${refCode}`;
      }

      if (contactIsDifferent) {
        finalDescription += '\n\nOBS! Kontaktperson i ärendet är:\n';
        if (contactPerson && contactPerson !== userData?.name) {
          finalDescription += `Namn: ${contactPerson}\n`;
        }
        if (phone && phone !== userData?.phone) {
          finalDescription += `Telefon: ${cleanPhone(phone)}\n`;
        }
        if (email && email !== userData?.email) {
          finalDescription += `E-post: ${email}`;
        }
      }

      const workOrderPayload = {
        arbetsordertypKod: orderType === 'felanmalan' ? 'F' : 'G',
        kundNr: kundNr || 'SERVA10311',
        objektId: selectedObjekt.id,
        ursprung: '1',
        information: {
          beskrivning: finalDescription,
        },
        anmalare: {
          namn: userData?.name || 'Okänd',
          telefon: cleanPhone(userData?.phone || ''),
          epostAdress: userData?.email || ''
        }
      };

      if (orderType === 'bestallning') {
        workOrderPayload.fakturera = { faktureras: 'true' };
      }

      if (isConfidential) {
        workOrderPayload.externtNr = 'CONFIDENTIAL';
      }

      if (selectedUtrymme?.id) {
        workOrderPayload.utrymmesId = parseInt(selectedUtrymme.id);
      }

      if (selectedEnhet?.id) {
        workOrderPayload.enhetsId = parseInt(selectedEnhet.id);
      }

      const workOrder = await apiClient.createWorkOrder(workOrderPayload);
      const arbetsorderId = workOrder.arbetsorderId || workOrder.id;

      setWorkOrderNumber(arbetsorderId);
      setSubmitSuccess(true);

      // Upload files if present
      if (files.length > 0) {
        try {
          const uploadPromises = files.map(file => apiClient.uploadTempFile(file));
          const uploadResults = await Promise.all(uploadPromises);

          const filePayload = {
            fil: uploadResults.map(result => ({
              filnamn: result.fileName,
              typ: 'DOKEXTIMG'
            }))
          };

          await apiClient.attachFilesToWorkOrder(arbetsorderId, filePayload);
        } catch (error) {
          console.error('File upload failed:', error);
        }
      }

      // Reset form after 5 seconds
      setTimeout(() => {
        handleReset();
        setSubmitSuccess(false);
        setWorkOrderNumber('');
      }, 5000);

    } catch (error) {
      console.error('Error submitting work order:', error);
      setSubmitError(error.message || 'Något gick fel vid inskickning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setOrderType('felanmalan');
    setRefCode('');
    setSelectedObjektId('');
    setSelectedObjekt(null);
    setSelectedUtrymmesId('');
    setSelectedUtrymme(null);
    setSelectedEnhetId('');
    setSelectedEnhet(null);
    setDescription('');
    setContactPerson(userData?.name || '');
    setPhone(userData?.phone || '');
    setEmail(userData?.email || '');
    setFiles([]);
    setFileError('');
    setIsConfidential(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onObjektSelected) onObjektSelected(null);
    if (onWorkOrdersLoaded) onWorkOrdersLoaded([]);
  };

  const handleObjektChange = (value) => {
    setSelectedObjektId(value);
    const objekt = objektList.find(o => o.id === value);
    setSelectedObjekt(objekt);
    setSelectedUtrymmesId('');
    setSelectedUtrymme(null);

    if (onObjektSelected && objekt) {
      onObjektSelected({ id: objekt.id, namn: objekt.namn });
    } else if (onObjektSelected) {
      onObjektSelected(null);
    }
  };

  const objektOptions = objektList.map(o => ({
    value: o.id,
    label: `${o.namn}${o.objektNr ? ` (${o.objektNr})` : ''}`
  }));

  const utrymmesComboboxOptions = utrymmesOptions.map(u => ({
    value: u.id,
    label: u.namn
  }));

  const enheterOptionsList = enheterOptions.map(e => ({
    value: e.id,
    label: e.namn
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {orderType === 'felanmalan' ? 'Skapa felanmälan' : 'Skapa beställning'}
      </h2>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">
                {orderType === 'felanmalan' ? 'Felanmälan skickad!' : 'Beställning skickad!'}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Ärendenummer: <strong>{workOrderNumber}</strong>
              </p>
              <p className="text-sm text-green-600 mt-2">
                Formuläret rensas automatiskt om 5 sekunder...
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <h3 className="font-semibold text-red-800">Fel vid inskickning</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Combobox
            label="Objekt"
            options={objektOptions}
            value={selectedObjektId}
            onChange={handleObjektChange}
            placeholder={isLoadingObjekt ? "Laddar objekt..." : "Sök objekt..."}
            disabled={isLoadingObjekt}
          />
          {selectedObjekt && (
            <p className="text-sm text-gray-600 mt-2">
              📍 {getAddressString(selectedObjekt.adress)}
            </p>
          )}
        </div>

        <div>
          <Combobox
            label="Utrymme (valfritt)"
            options={utrymmesComboboxOptions}
            value={selectedUtrymmesId}
            onChange={setSelectedUtrymmesId}
            placeholder={
              !selectedObjektId ? "Välj objekt först..." :
              isLoadingUtrymmen ? "Laddar utrymmen..." :
              utrymmesComboboxOptions.length === 0 ? "Inga utrymmen" :
              "Välj utrymme..."
            }
            disabled={!selectedObjektId || isLoadingUtrymmen}
          />
        </div>

        <div>
          <Combobox
            label="Enhet (valfritt)"
            options={enheterOptionsList}
            value={selectedEnhetId}
            onChange={setSelectedEnhetId}
            placeholder={
              !selectedUtrymmesId ? "Välj utrymme först..." :
              isLoadingEnheter ? "Laddar enheter..." :
              "Välj enhet..."
            }
            disabled={!selectedUtrymmesId || isLoadingEnheter}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Beskrivning <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv felet eller servicebehovet..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Typ av ärende</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="felanmalan"
                checked={orderType === 'felanmalan'}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="ml-2 text-sm">Felanmälan</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="bestallning"
                checked={orderType === 'bestallning'}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="ml-2 text-sm">Beställning</span>
            </label>
          </div>
        </div>

        {orderType === 'bestallning' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Referenskod <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Ange referenskod"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">
            ℹ️ Kontaktuppgifter
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kontaktperson</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-post</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ladda upp filer (valfritt)</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max 5 filer, 4MB per fil
          </p>
          {fileError && (
            <p className="text-sm text-red-600 mt-2">⚠️ {fileError}</p>
          )}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 text-sm ml-2"
                  >
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <div className="ml-3">
              <span className="text-sm font-medium">Sekretessmarkera arbetsorder</span>
              <p className="text-xs text-gray-500 mt-1">
                Sekretessmarkerade ärenden filtreras bort från visningar
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-pink-400 text-white py-3 px-6 rounded-md font-semibold hover:bg-pink-500 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Skickar...' : (orderType === 'felanmalan' ? 'Skicka felanmälan' : 'Skicka beställning')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-md font-semibold hover:bg-gray-50"
          >
            Rensa
          </button>
        </div>
      </form>
    </div>
  );
}
