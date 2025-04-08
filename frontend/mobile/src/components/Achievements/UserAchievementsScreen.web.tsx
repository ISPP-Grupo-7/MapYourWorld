import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_URL } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import AlertModal from '../UI/Alert';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Button from '../UI/Button';

interface Achievement {
  name: string;
  description: string;
  points: number;
  iconUrl: string;
}

const iconPlaceholder = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQOuXSNhx4c8pKvcysPWidz4NibDU-xLeaJw&s";

const UserAchievementsScreen = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [achievementName, setAchievementName] = useState<string>("");
  const [achievementDescription, setAchievementDescription] = useState<string>("");
  const [achievementPoints, setAchievementPoints] = useState<number>(0);
  const [achievementIcon, setAchievementIcon] = useState<string>(iconPlaceholder);

  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertActionText, setAlertActionText] = useState<string>("");
  const [alertOnAction, setAlertOnAction] = useState<(() => void) | undefined>(undefined);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [filter, setFilter] = useState<'user' | 'all'>('user');


  const showAlert = (
    title: string,
    message: string,
    onAction?: () => void
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnAction(() => onAction);
    setAlertVisible(true);
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error("Error al obtener la subscripción", error);
      }
    };

    const fetchAchievements = async () => {
      if (!user) {
        setError("No hay usuario autenticado");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/user-achievements/achievements/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        const transformed = data.map((item: any) => ({
          name: item.achievement ? item.achievement.name : item.name,
          description: item.achievement ? item.achievement.description : item.description,
          points: item.achievement ? item.achievement.points : item.points,
          iconUrl: item.achievement ? item.achievement.iconUrl : item.iconUrl,
        }));
        setAchievements(transformed);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener los logros", error);
        setError("Error al obtener los logros");
        setLoading(false);
      }
    };

    const fetchAllAchievements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/achievements`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setAchievements(data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener todos los logros", error);
        setError("Error al obtener todos los logros");
        setLoading(false);
      }
    };


    fetchSubscription();
    if (filter === 'user') {
      fetchAchievements();
    } else {
      fetchAllAchievements();
    }
  }, [user, filter]);


  const createAchievement = async () => {
    if (!achievementName.trim()) {
      showAlert("Error", "Por favor, ingresa un nombre para el logro");
      return;
    }

    try {
      setLoading(true);
      const achievementData = {
        name: achievementName,
        description: achievementDescription || "Logro desbloqueado",
        iconUrl: achievementIcon || iconPlaceholder,
        points: achievementPoints,
      };
      const response = await fetch(`${API_URL}/api/achievements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(achievementData),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json"))
        throw new Error("Error al crear el logro");
      const data = await response.json();
      if (data.success) {
        setAchievementName("");
        setAchievementDescription("");
        setAchievementPoints(0);
        setAchievementIcon("default_icon.png");
        setShowCreateModal(false);
        showAlert("Éxito", "Logro creado correctamente");
      } else {
        throw new Error(data.message || "Error al crear el logro");
      }
    } catch (error: any) {
      console.error("Error al crear logro:", error);
      showAlert("Error", `No se pudo crear el logro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <ActivityIndicator size="large" color="#14b8a6" />
        </div>
        <div style={{ color: '#4b5563', fontSize: 16 }}>Cargando logros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 16,
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ color: '#ef4444', fontSize: 18, marginBottom: 8 }}>{error}</div>
        <div style={{ color: '#4b5563', fontSize: 16 }}>Inicia sesión para ver tus logros</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        margin: '0 auto',
        minWidth: '60%',
        maxHeight: '100vh',
        overflowY: 'auto',
        padding: 16,
        marginTop: 16,
        boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
      }}
    >

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 16,
        }}
      >
        {/* Contenedor de botones de filtro */}
        <div style={{ display: 'flex', flex: 1, gap: '1rem' }}>
          <button
            onClick={() => setFilter('user')}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: 8,
              border: filter === 'user' ? '2px solid #14b8a6' : '1px solid #ddd',
              backgroundColor: filter === 'user' ? '#2bbbad' : 'white',
              color: filter === 'user' ? 'white' : '#2bbbad',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            Logros obtenidos
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: 8,
              border: filter === 'all' ? '2px solid #14b8a6' : '1px solid #ddd',
              backgroundColor: filter === 'all' ? '#2bbbad' : 'white',
              color: filter === 'all' ? 'white' : '#2bbbad',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            Todos los logros
          </button>
        </div>

        {/* Botón de crear logro */}
        <div
          style={{
            backgroundColor: 'rgb(43, 187, 173)',
            padding: '8px',
            borderRadius: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            flexShrink: 0,
          }}
          onClick={() => {
            if (subscription && subscription.plan !== "PREMIUM") {
              showAlert(
                "Función Premium",
                "La creación de logros personalizados es exclusiva para usuarios premium. ¡Mejora tu cuenta para desbloquear esta función!",
                () => {
                  navigation.navigate('Payment');
                  setAlertVisible(false);
                }
              );
            } else {
              setShowCreateModal(true);
            }
          }}
        >
          <Icon name="add" size={24} color="white" />
        </div>
      </div>


     {/* Lista de logros o mensaje vacío */}
      {achievements.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          {filter === 'user'
            ? 'Aún no has obtenido logros.'
            : 'Aún no se han creado logros.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            rowGap: 32,
            columnGap: 16,
          }}
        >
          {achievements.map((achievement, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                minHeight: '20vh',
              }}
            >
              <img
                src={achievement.iconUrl}
                alt={achievement.name}
                style={{
                  width: 100,
                  height: 100,
                  marginRight: 20,
                  borderRadius: 12,
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <h3 style={{ fontSize: 24, fontWeight: 'bold', color: '#0d9488' }}>
                  {achievement.name}
                </h3>
                <p style={{ color: '#6b7280', fontSize: 16 }}>
                  {achievement.description}
                </p>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                  Puntos: {achievement.points}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Modal de creación */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 12,
              width: '410px',
              maxWidth: '410px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: customInputStyles }} />

            <h2
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 30,
                textAlign: 'center',
              }}
            >
              ¡Crea tu propio logro!
            </h2>

            {/* Nombre del logro */}
            <div className="input-container" style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                Nombre*
              </label>
              <input
                type="text"
                value={achievementName}
                onChange={(e) => setAchievementName(e.target.value)}
                placeholder="Ej: Explorador Maestro"
                maxLength={30}
                className="input-field"
              />
            </div>

            {/* Descripción */}
            <div className="input-container" style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                Descripción
              </label>
              <textarea
                value={achievementDescription}
                onChange={(e) => setAchievementDescription(e.target.value)}
                placeholder="Descripción del logro"
                maxLength={100}
                className="input-field"
                style={{ minHeight: 80, resize: 'none' }}
              />
            </div>

            {/* Puntos */}
            <div className="input-container" style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                Puntos
              </label>
              <input
                type="number"
                value={achievementPoints.toString()}
                onChange={(e) => setAchievementPoints(Number(e.target.value))}
                placeholder="Puntos del logro"
                className="input-field"
              />
            </div>

            {/* Ícono del logro */}
            <div className="input-container" style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                Ícono del logro
              </label>
              <input
                type="text"
                value={achievementIcon}
                onChange={(e) => setAchievementIcon(e.target.value)}
                placeholder="URL del icono"
                className="input-field"
              />
            </div>
            {/* TODO: PERMITIR DRAG DE IMAGEN */}
            {/* Ícono del logro */}
            {/* Campo de imagen por drag & drop */}
            {/* <div className="input-container" style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'block',
                  textAlign: 'left',
                }}
              >
                Ícono del logro
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAchievementIcon(reader.result as string); // base64 image
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={() => document.getElementById('icon-input')?.click()}
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: 8,
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                }}
              >
                {achievementIcon && achievementIcon !== iconPlaceholder ? (
                  <img
                    src={achievementIcon}
                    alt="Preview"
                    style={{ width: 60, height: 60, objectFit: 'cover', margin: '0 auto' }}
                  />
                ) : (
                  <span style={{ color: '#888' }}>Arrastra una imagen aquí o haz clic para seleccionar</span>
                )}
                <input
                  id="icon-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAchievementIcon(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div> */}


            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button
                onClick={createAchievement}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 8,
                  backgroundColor: '#14b8a6',
                  border: 'none',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                  marginLeft: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                Crear
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  color: '#2bbbad',
                  fontWeight: 'bold',
                  fontSize: 16,
                  marginRight: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={
          alertActionText
            ? `${alertMessage}\n\nAcción: ${alertActionText}`
            : alertMessage
        }
        onClose={() => setAlertVisible(false)}
        onAction={alertOnAction}
      />
    </div>
  );
};

const customInputStyles = `
  .input-container input,
  .input-container textarea {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 15px;
    font-size: 16px;
    height: 44px;
    box-sizing: border-box;
    width: 100%;
    appearance: none;
  }
  
  .input-container textarea {
    height: auto;
  }

  .input-container {
    margin-bottom: 20px;
  }
`;


export default UserAchievementsScreen;
