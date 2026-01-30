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
  const [isLoadingUtrymmen, setIsLoadingUtrymmen] = useState(false);

  const [enheterOptions, setEnheterOptions] = useState([]);
  const [selectedEnhetId, setSelectedEnhetId] = useState('');
  const [isLoadingEnheter, setIsLoadingEnheter] = useState(false);

  const [orderType, setOrderType] = useState('felanmalan');
  const [refCode, setRefCode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [permalink, setPermalink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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
    }
  }, [selectedObjektId]);

  // Load enheter when utrymme changes
  useEffect(() => {
    if (selectedUtrymmesId) {
      loadEnheter(selectedUtrymmesId);
    } else {
      setEnheterOptions([]);
      setSelectedEnhetId('');
    }
  }, [selectedUtrymmesId]);

  // URL parameter reading - Step 1: Apply objekt from URL
  useEffect(() => {
    if (objektList.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const objektParam = urlParams.get('objekt');
    const utrymmesParam = urlParams.get('utrymme');
    const enhetParam = urlParams.get('enhet');
    const locationParam = urlParams.get('plats');

    if (objektParam && !selectedObjektId) {
      const objektExists = objektList.find(o => o.id === objektParam);

      if (objektExists) {
        handleObjektChange(objektParam);

        // Save utrymme/enhet for later (wait for loading)
        if (utrymmesParam) {
          sessionStorage.setItem('felanmalan_pending_utrymme', utrymmesParam);
        }
        if (enhetParam) {
          sessionStorage.setItem('felanmalan_pending_enhet', enhetParam);
        }
      }
    }

    // Apply location from URL if present
    if (locationParam && !location) {
      setLocation(decodeURIComponent(locationParam));
    }
  }, [objektList]);

  // URL parameter reading - Step 2: Apply utrymme after loading
  useEffect(() => {
    const pendingUtrymme = sessionStorage.getItem('felanmalan_pending_utrymme');

    if (pendingUtrymme && utrymmesOptions.length > 0 && !selectedUtrymmesId) {
      const utrymmesExists = utrymmesOptions.find(u => u.id === pendingUtrymme);

      if (utrymmesExists) {
        setSelectedUtrymmesId(pendingUtrymme);
        sessionStorage.removeItem('felanmalan_pending_utrymme');
      } else {
        sessionStorage.removeItem('felanmalan_pending_utrymme');
        sessionStorage.removeItem('felanmalan_pending_enhet');
      }
    }
  }, [utrymmesOptions]);

  // URL parameter reading - Step 3: Apply enhet after loading
  useEffect(() => {
    const pendingEnhet = sessionStorage.getItem('felanmalan_pending_enhet');

    if (pendingEnhet && enheterOptions.length > 0 && !selectedEnhetId) {
      const enhetExists = enheterOptions.find(e => e.id === pendingEnhet);

      if (enhetExists) {
        setSelectedEnhetId(pendingEnhet);
        sessionStorage.removeItem('felanmalan_pending_enhet');
      } else {
        sessionStorage.removeItem('felanmalan_pending_enhet');
      }
    }
  }, [enheterOptions]);

  // Permalink generation
  useEffect(() => {
    if (selectedObjektId || selectedUtrymmesId || selectedEnhetId || location) {
      const params = new URLSearchParams();

      if (selectedObjektId) params.set('objekt', selectedObjektId);
      if (selectedUtrymmesId) params.set('utrymme', selectedUtrymmesId);
      if (selectedEnhetId) params.set('enhet', selectedEnhetId);
      if (location) params.set('plats', encodeURIComponent(location));

      const baseUrl = window.location.origin + window.location.pathname;
      const fullUrl = `${baseUrl}?${params.toString()}`;

      setPermalink(fullUrl);
    } else {
      setPermalink('');
    }
  }, [selectedObjektId, selectedUtrymmesId, selectedEnhetId, location]);

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

  /**
   * Compress and resize image files to reduce upload size
   * - Images: Resized to max 1920px, compressed to JPEG 85%
   * - PDFs: Passed through unchanged
   * - Max output size: 10MB (increased from 4MB for original)
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // If it's a PDF, return as-is
      if (file.type === 'application/pdf') {
        resolve(file);
        return;
      }

      // Only compress images
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions (max 1920px on longest side)
          const MAX_SIZE = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'));
                return;
              }

              // Create new File object with original name
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError('');

    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > 5) {
      setFileError(`Max 5 filer kan laddas upp (du har redan ${files.length} filer)`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const maxImageSize = 20 * 1024 * 1024; // 20MB for images (will be compressed to ~1-2MB)
    const maxPdfSize = 2 * 1024 * 1024; // 2MB for PDFs (not compressed)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    // Validate files before processing
    for (const file of selectedFiles) {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setFileError(`Filen "${file.name}" har ogiltigt format`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check file size based on type
      if (file.type === 'application/pdf') {
        if (file.size > maxPdfSize) {
          setFileError(`PDF-filen "${file.name}" är för stor (max 2MB för PDF)`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      } else {
        // Image files
        if (file.size > maxImageSize) {
          setFileError(`Bilden "${file.name}" är för stor (max 20MB)`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }
    }

    // Show processing indicator
    setIsProcessingFiles(true);

    try {
      // Compress images (PDFs pass through unchanged)
      const processedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file))
      );

      // Add processed files to existing files
      setFiles(prev => [...prev, ...processedFiles]);

    } catch (error) {
      console.error('File processing error:', error);
      setFileError('Kunde inte bearbeta filen. Försök igen.');
    } finally {
      setIsProcessingFiles(false);
      // Clear the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

    if (!selectedUtrymmesId) {
      setSubmitError('Vänligen välj ett utrymme');
      return;
    }

    if (enheterOptions.length > 0 && !selectedEnhetId) {
      setSubmitError('Vänligen välj en enhet');
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

    if (!location.trim()) {
      setSubmitError('Vänligen ange exakt plats');
      return;
    }

    if (!phone.trim()) {
      setSubmitError('Vänligen ange telefonnummer');
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

      let finalDescription = `${location.trim()}\n\n${description}`;

      if (orderType === 'bestallning' && refCode.trim()) {
        finalDescription += `\n\nReferenskod: ${refCode}`;
      }

      if (contactIsDifferent) {
        finalDescription += '\n\nOBS! Kontaktperson i ärendet är:\n';
        // Only include fields that differ from the logged-in user
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
        ursprung: '9',
        information: {
          beskrivning: finalDescription,
        },
        anmalare: {
          namn: userData?.name || 'Okänd',
          telefon: cleanPhone(phone),
          epostAdress: userData?.email || ''
        }
      };

      if (orderType === 'bestallning') {
        workOrderPayload.fakturera = { faktureras: 'false' };
      }

      if (isConfidential) {
        workOrderPayload.externtNr = 'CONFIDENTIAL';
      }

      if (selectedUtrymmesId) {
        workOrderPayload.utrymmesId = parseInt(selectedUtrymmesId);
      }

      if (selectedEnhetId) {
        workOrderPayload.enhetsId = parseInt(selectedEnhetId);
      }

      const workOrder = await apiClient.createWorkOrder(workOrderPayload);

      // Handle both direct and nested response structures
      const arbetsorderId = workOrder.arbetsorderId
        || workOrder.id
        || workOrder.data?.arbetsorderId
        || workOrder.data?.id;

      setWorkOrderNumber(arbetsorderId);
      setSubmitSuccess(true);

      // Upload files if present
      if (files.length > 0) {
        try {
          const uploadPromises = files.map(file => apiClient.uploadTempFile(file));
          const uploadResults = await Promise.all(uploadPromises);

          // Build file attachment payload with proper field extraction
          const filePayload = {
            fil: uploadResults.map(result => {
              // Handle various possible response structures
              const fileName = result.fileName || result.filnamn || result.data?.fileName || result.data?.filnamn;

              if (!fileName) {
                console.error('Missing fileName in upload result:', result);
                throw new Error('Filuppladdning misslyckades - filnamn saknas');
              }

              return {
                filnamn: fileName,
                typ: 'DOKEXTIMG'
              };
            })
          };

          await apiClient.attachFilesToWorkOrder(arbetsorderId, filePayload);
        } catch (error) {
          console.error('File upload failed:', error);
          setSubmitError('Arbetsorder skapades men filuppladdning misslyckades: ' + error.message);
        }
      }

      // Scroll to top and reload work orders to show new order
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save current objekt before reset
      const currentObjektId = selectedObjektId;
      const currentObjekt = selectedObjekt;

      // Reload work orders for current object to show the newly created order
      if (currentObjektId) {
        loadWorkOrdersForObject(currentObjektId);
      }

      // Reset form after 5 seconds but keep objekt selected
      setTimeout(() => {
        // Reset all fields except objekt
        setOrderType('felanmalan');
        setRefCode('');
        setLocation('');
        setSelectedUtrymmesId('');
        setSelectedEnhetId('');
        setDescription('');
        setContactPerson(userData?.name || '');
        setPhone(userData?.phone || '');
        setEmail(userData?.email || '');
        setFiles([]);
        setFileError('');
        setIsConfidential(false);
        sessionStorage.removeItem('felanmalan_pending_utrymme');
        sessionStorage.removeItem('felanmalan_pending_enhet');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Keep objekt selected and reload work orders again
        setSelectedObjektId(currentObjektId);
        setSelectedObjekt(currentObjekt);
        if (currentObjektId) {
          loadWorkOrdersForObject(currentObjektId);
        }

        // Clear success message
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
    setLocation('');
    setSelectedObjektId('');
    setSelectedObjekt(null);
    setSelectedUtrymmesId('');
    setSelectedEnhetId('');
    setDescription('');
    setContactPerson(userData?.name || '');
    setPhone(userData?.phone || '');
    setEmail(userData?.email || '');
    setFiles([]);
    setFileError('');
    setIsConfidential(false);
    sessionStorage.removeItem('felanmalan_pending_utrymme');
    sessionStorage.removeItem('felanmalan_pending_enhet');
    setPermalink('');
    setCopySuccess(false);

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

    if (onObjektSelected && objekt) {
      onObjektSelected({ id: objekt.id, namn: objekt.namn });
    } else if (onObjektSelected) {
      onObjektSelected(null);
    }
  };

  const objektOptions = objektList.map(o => ({
    value: o.id,
    label: o.namn
  }));

  const utrymmesComboboxOptions = utrymmesOptions.map(u => ({
    value: u.id,
    label: u.namn
  }));

  const enheterOptionsList = enheterOptions.map(e => ({
    value: e.id,
    label: e.namn
  }));

  const handleCopyPermalink = async () => {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopySuccess(true);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy permalink:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = permalink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="uk-card uk-card-default uk-card-body">
      <h2 className="uk-heading-small uk-margin">
        {orderType === 'felanmalan' ? 'Skapa felanmälan' : 'Skapa beställning'}
      </h2>

      {submitSuccess && (
        <div className="uk-alert-success uk-margin" uk-alert>
          <div className="uk-flex uk-flex-top">
            <span className="uk-text-large uk-margin-small-right">✅</span>
            <div>
              <h3 className="uk-text-bold">
                {orderType === 'felanmalan' ? 'Felanmälan skickad!' : 'Beställning skickad!'}
              </h3>
              <p className="uk-text-small uk-margin-small-top">
                Ärendenummer: <strong>{workOrderNumber}</strong>
              </p>
              <p className="uk-text-small uk-margin-small-top">
                Formuläret rensas automatiskt om 5 sekunder...
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="uk-alert-danger uk-margin" uk-alert>
          <div className="uk-flex uk-flex-top">
            <span className="uk-text-large uk-margin-small-right">❌</span>
            <div>
              <h3 className="uk-text-bold">Fel vid inskickning</h3>
              <p className="uk-text-small uk-margin-small-top">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="uk-margin">
          <Combobox
            label="Objekt"
            options={objektOptions}
            value={selectedObjektId}
            onChange={handleObjektChange}
            placeholder={isLoadingObjekt ? "Laddar objekt..." : "Sök objekt..."}
            disabled={isLoadingObjekt}
          />
          {selectedObjekt && (
            <p className="uk-text-small uk-text-muted uk-margin-small-top">
              📍 {getAddressString(selectedObjekt.adress)}
            </p>
          )}
        </div>

        <div className="uk-margin">
          <Combobox
            label="Utrymme"
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

        {enheterOptions.length > 0 && (
          <div className="uk-margin">
            <Combobox
              label="Enhet"
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
        )}

        <div className="uk-margin">
          <label className="uk-form-label">
            Ange exakt plats: <span className="uk-text-danger">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="T.ex. Klassrum 214, personalrum våning 2"
            required
            className="uk-input"
          />
        </div>

        <div className="uk-margin">
          <label className="uk-form-label">
            Beskrivning <span className="uk-text-danger">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv felet eller servicebehovet..."
            rows={4}
            required
            className="uk-textarea"
          />
        </div>

        <div className="uk-margin">
          <label className="uk-form-label">Typ av ärende</label>
          <div className="uk-flex uk-flex-middle" style={{gap: '1rem'}}>
            <label>
              <input
                type="radio"
                value="felanmalan"
                checked={orderType === 'felanmalan'}
                onChange={(e) => setOrderType(e.target.value)}
                className="uk-radio"
              />
              <span className="uk-text-small" style={{marginLeft: '0.5rem'}}>Felanmälan</span>
            </label>
            <label>
              <input
                type="radio"
                value="bestallning"
                checked={orderType === 'bestallning'}
                onChange={(e) => setOrderType(e.target.value)}
                className="uk-radio"
              />
              <span className="uk-text-small" style={{marginLeft: '0.5rem'}}>Beställning</span>
            </label>
          </div>
        </div>

        {orderType === 'bestallning' && (
          <div className="uk-margin">
            <label className="uk-form-label">
              Referenskod <span className="uk-text-danger">*</span>
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Ange referenskod"
              required
              className="uk-input"
            />
          </div>
        )}

        <div className="uk-card uk-card-default uk-card-body uk-margin">
          <h4 className="uk-card-title uk-margin-small-bottom">Kontaktuppgifter</h4>
          <p className="uk-text-small uk-text-muted uk-margin-small-bottom">
            Kontaktperson på plats (ditt namn förifyllt – ändra vid behov)
          </p>
          <div>
            <div className="uk-margin">
              <label className="uk-form-label">Kontaktperson</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="uk-input"
              />
            </div>
            <div className="uk-margin">
              <label className="uk-form-label">Telefon *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="uk-input"
                required
              />
            </div>
            <div className="uk-margin">
              <label className="uk-form-label">E-post</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uk-input"
              />
            </div>
          </div>
        </div>

        <div className="uk-margin">
          <label className="uk-form-label">Ladda upp filer (valfritt)</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="uk-input"
            disabled={files.length >= 5 || isProcessingFiles}
          />
          <p className="uk-text-meta uk-margin-small-top">
            {isProcessingFiles
              ? '⏳ Bearbetar och komprimerar bilder...'
              : files.length < 5
              ? `Lägg till filer (${files.length}/5) • Bilder max 20MB, PDF max 2MB • Bilder komprimeras automatiskt`
              : 'Max antal filer uppnått (5/5)'}
          </p>
          {fileError && (
            <p className="uk-text-small uk-text-danger uk-margin-small-top">⚠️ {fileError}</p>
          )}
          {files.length > 0 && (
            <div className="uk-margin-small-top">
              {files.map((file, index) => (
                <div key={index} className="uk-flex uk-flex-middle uk-flex-between uk-card uk-card-default uk-card-body uk-padding-small uk-margin-small-bottom">
                  <div className="uk-flex uk-flex-column" style={{flex: 1, minWidth: 0}}>
                    <span className="uk-text-small uk-text-truncate">{file.name}</span>
                    <span className="uk-text-meta" style={{fontSize: '0.7rem'}}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="uk-text-small uk-text-danger uk-margin-small-left"
                    style={{flexShrink: 0}}
                  >
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="uk-card uk-card-default uk-card-body uk-margin">
          <label>
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="uk-checkbox"
            />
            <span className="uk-text-small uk-text-bold uk-margin-small-left">Sekretessmarkera arbetsorder</span>
            <p className="uk-text-meta uk-margin-small-top">
              Sekretessmarkerade ärenden filtreras bort från visningar
            </p>
          </label>
        </div>

        <div className="uk-flex uk-margin" style={{gap: '1rem'}}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="uk-button uk-button-primary uk-width-expand"
            style={{backgroundColor: '#f472b6'}}
          >
            {isSubmitting ? 'Skickar...' : (orderType === 'felanmalan' ? 'Skicka felanmälan' : 'Skicka beställning')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="uk-button uk-button-default"
          >
            Rensa
          </button>
        </div>
      </form>

      {permalink && (
        <div className="uk-card uk-card-default uk-card-body uk-margin-top">
          <h4 className="uk-card-title uk-text-small">Permalänk till detta val</h4>
          <p className="uk-text-meta uk-margin-small-bottom">
            Dela denna länk för att hjälpa andra att fylla i formuläret med samma val
          </p>
          <div className="uk-flex uk-flex-middle" style={{gap: '0.5rem'}}>
            <input
              type="text"
              value={permalink}
              readOnly
              className="uk-input uk-form-small"
              style={{fontFamily: 'monospace', fontSize: '0.85rem'}}
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopyPermalink}
              className="uk-button uk-button-primary uk-button-small"
              style={{backgroundColor: copySuccess ? '#32d296' : '#1e87f0', whiteSpace: 'nowrap'}}
              title="Kopiera länk"
            >
              {copySuccess ? '✓ Kopierad!' : 'Kopiera'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
