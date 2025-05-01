import React, { useState } from 'react';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { label: 'Monumentos', value: 'MONUMENTOS' },
  { label: 'Estaciones', value: 'ESTACIONES' },
  { label: 'Mercados', value: 'MERCADOS' },
  { label: 'Plazas', value: 'PLAZAS' },
  { label: 'Otros', value: 'OTROS' },
];

interface Business {
  name: string;
  description: string;
  category: string;
  photos: string[];
  latitude: string;
  longitude: string;
}

// Componente de botón estilizado
const Button = ({ title, onPress, fullWidth }: { title: string; onPress: () => void; fullWidth: boolean }) => {
  return (
    <button
      onClick={onPress}
      style={{
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        width: fullWidth ? '100%' : 'auto',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
    >
      {title}
    </button>
  );
};

const DashboardAdmin = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [pointOfInterest, setPointOfInterest] = useState<Business>({
    name: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    photos: [],
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);  // Estado para mostrar el modal
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectCategory = (categoryValue: string) => {
    setPointOfInterest({
      ...pointOfInterest,
      category: categoryValue,
    });
    setDropdownVisible(false);
  };

  const validateFields = () => {
    if (
      !pointOfInterest.name ||
      !pointOfInterest.description ||
      !pointOfInterest.category ||
      !pointOfInterest.latitude ||
      !pointOfInterest.longitude
    ) {
      setErrorMessage('Todos los campos son obligatorios.');
      return false;
    }

    const latitude = pointOfInterest.latitude.replace(',', '.');
    const longitude = pointOfInterest.longitude.replace(',', '.');

    // Validar que las coordenadas sean números decimales válidos
    const latitudeNum = parseFloat(latitude);
    const longitudeNum = parseFloat(longitude);

    // Validación para latitud y longitud
    const isLatitudeValid = !isNaN(latitudeNum) && Math.abs(latitudeNum) <= 90;
    const isLongitudeValid = !isNaN(longitudeNum) && Math.abs(longitudeNum) <= 180;

    if (!isLatitudeValid || !isLongitudeValid) {
      setErrorMessage('La latitud debe estar entre -90 y 90 y la longitud entre -180 y 180.');
      return false;
    }

    return true;
  };

  const handleAddBusiness = async (business: Business) => {
    if (!validateFields()) return;  // Validar antes de continuar

    const latitudeNum = parseFloat(business.latitude);
    const longitudeNum = parseFloat(business.longitude);
    console.log(latitudeNum, longitudeNum);

    const payload = {
      poiData: {
        ...business,
        location: {
          type: "Point",
          coordinates: [longitudeNum, latitudeNum],
        },
      },
      userId: user?.id,
    };

    try {
      const response = await fetch(`${API_URL}/api/poi/admin/create/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = {};
      if (text) {
        data = JSON.parse(text);
      }

      if (response.ok) {
        console.log('POI creado exitosamente:', data);
        setShowModal(true);  // Muestra el modal de éxito
        setPointOfInterest({
          name: '',
          description: '',
          category: '',
          latitude: '',
          longitude: '',
          photos: [],
        });  // Limpiar el formulario
      } else {
        const errorMessage = (data as { error?: string }).error || 'No se pudo crear el POI';
        if (errorMessage.toLowerCase().includes('duplicada')) {
          alert('Error: Ya existe un negocio registrado en esta ubicación.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
        console.error('Error al crear el POI:', errorMessage);
      }
    } catch (error) {
      console.error('Hubo un problema con la solicitud:', error);
      alert('Hubo un problema al crear el POI. Intenta nuevamente.');
    }
  };

  const closeModal = () => {
    setShowModal(false);  // Cerrar el modal
    setIsFormVisible(false);  // Opcional: si quieres ocultar el formulario al cerrar el modal
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Panel de Administración</h2>
        </div>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>
          Gestiona la publicidad geolocalizada de las empresas
        </p>

        <Button
          title="Añadir Publicidad de Empresa"
          onPress={() => setIsFormVisible(true)}
          fullWidth
        />

        {isFormVisible && (
          <div style={{ marginTop: '20px' }}>
            {errorMessage && <p style={{ color: 'red', textAlign: 'center' }}>{errorMessage}</p>}

            <label style={{ fontSize: '18px', marginBottom: '10px' }}>Nombre del Punto de Interés</label>
            <input
              type="text"
              value={pointOfInterest.name}
              onChange={(e) => setPointOfInterest({ ...pointOfInterest, name: e.target.value })}
              placeholder="Nombre"
              style={{ padding: '10px', borderRadius: '5px', width: '100%', marginBottom: '20px', border: '1px solid #ccc' }}
            />

            <label style={{ fontSize: '18px', marginBottom: '10px' }}>Descripción</label>
            <input
              type="text"
              value={pointOfInterest.description}
              onChange={(e) => setPointOfInterest({ ...pointOfInterest, description: e.target.value })}
              placeholder="Descripción"
              style={{ padding: '10px', borderRadius: '5px', width: '100%', marginBottom: '20px', border: '1px solid #ccc' }}
            />

            <label style={{ fontSize: '18px', marginBottom: '10px' }}>Categoría</label>
            <div onClick={() => setDropdownVisible(!dropdownVisible)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '20px' }}>
              <span>
                {pointOfInterest.category
                  ? categories.find((cat) => cat.value === pointOfInterest.category)?.label
                  : 'Seleccionar categoría'}
              </span>
            </div>

            {dropdownVisible && (
              <div style={{ border: '1px solid #ccc', borderRadius: '5px', marginTop: '10px' }}>
                {categories.map((cat) => (
                  <div
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {cat.label}
                  </div>
                ))}
              </div>
            )}

            <label style={{ fontSize: '18px', marginBottom: '10px' }}>Latitud</label>
            <input
              type="number"
              value={pointOfInterest.latitude}
              onChange={(e) => setPointOfInterest({ ...pointOfInterest, latitude: e.target.value })}
              placeholder="Latitud"
              style={{ padding: '10px', borderRadius: '5px', width: '100%', marginBottom: '20px', border: '1px solid #ccc' }}
            />

            <label style={{ fontSize: '18px', marginBottom: '10px' }}>Longitud</label>
            <input
              type="number"
              value={pointOfInterest.longitude}
              onChange={(e) => setPointOfInterest({ ...pointOfInterest, longitude: e.target.value })}
              placeholder="Longitud"
              style={{ padding: '10px', borderRadius: '5px', width: '100%', marginBottom: '20px', border: '1px solid #ccc' }}
            />

            <Button
              title="Guardar Comercio"
              onPress={() => handleAddBusiness(pointOfInterest)}
              fullWidth
            />
          </div>
        )}

        {/* Modal de confirmación */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              width: '300px',
            }}>
              <h3>Comercio Guardado</h3>
              <p>El comercio se ha creado correctamente.</p>
              <Button
                title="Cerrar"
                onPress={closeModal}
                fullWidth
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
