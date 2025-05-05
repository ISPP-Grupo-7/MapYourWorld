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
  id?: string;
  name: string;
  description: string;
  points: number;
  iconUrl: string;
}

type Stats = {
  achievements: number;
  friends: number;
  createdPOI: number;
  unlockedDistricts: number;
  collabMaps: number;
};

const allAchievements: Achievement[] = [
  { id: "0e6bfcb2-350a-4c98-9195-9ec6b516e390", name: "Explorador Novato", description: "Crea tu primer punto de interés.", points: 10, iconUrl: "https://images.pexels.com/photos/1051077/pexels-photo-1051077.jpeg" },
  { id: "288930cb-27c2-4340-910b-3f2ffcc914dd", name: "Cartógrafo Aficionado", description: "Crea 10 puntos de interés.", points: 50, iconUrl: "https://images.pexels.com/photos/8869349/pexels-photo-8869349.jpeg" },
  { id: "8693fa93-723b-45c5-8392-662f73566787", name: "Maestro del Mapa", description: "Crea 50 puntos de interés.", points: 250, iconUrl: "https://images.pexels.com/photos/7634707/pexels-photo-7634707.jpeg" },
  { id: "c1339ed7-60d5-4027-9220-42df6d30d3f8", name: "Conector Social", description: "Haz tu primer amigo.", points: 15, iconUrl: "https://images.pexels.com/photos/9353433/pexels-photo-9353433.jpeg" },
  { id: "96bbe1f5-3e3c-4277-8113-9cdf8c8eaf2b", name: "Círculo de Amigos", description: "Haz 10 amigos.", points: 75, iconUrl: "https://images.pexels.com/photos/7968883/pexels-photo-7968883.jpeg" },
  { id: "295f40ea-bca7-4e35-911c-b217b6dec467", name: "Red Social", description: "Haz 50 amigos.", points: 400, iconUrl: "https://images.pexels.com/photos/10431338/pexels-photo-10431338.jpeg" },
  { id: "03d762f3-7701-4a87-a4d5-77f37330b506", name: "Primeros pasos", description: "Acumula 10 kilómetros de distancia.", points: 20, iconUrl: "https://images.pexels.com/photos/3601094/pexels-photo-3601094.jpeg" },
  { id: "b1b2d415-69c8-4b73-8e80-94fe825afcc0", name: "Maratonista Urbano", description: "Acumula 50 kilómetros de distancia.", points: 150, iconUrl: "https://images.pexels.com/photos/1526790/pexels-photo-1526790.jpeg" },
  { id: "5e99b4ec-c150-4de3-a83c-f1573d77b4de", name: "Explorador Incansable", description: "Acumula 200 kilómetros de distancia.", points: 750, iconUrl: "https://images.pexels.com/photos/421160/pexels-photo-421160.jpeg" },
  { id: "3cec81ea-6160-4188-9ffc-6610ba90e9a1", name: "Racha Inicial", description: "Inicia sesión 3 días consecutivos.", points: 25, iconUrl: "https://images.pexels.com/photos/4350099/pexels-photo-4350099.jpeg" },
  { id: "d17553e9-5308-4fa0-9b04-be015186ff9f", name: "Racha Semanal", description: "Inicia sesión 7 días consecutivos.", points: 100, iconUrl: "https://images.pexels.com/photos/2265488/pexels-photo-2265488.jpeg" },
  { id: "238e196c-bd6e-4413-9329-71e7a9753a70", name: "Racha Mensual", description: "Inicia sesión 30 días consecutivos.", points: 500, iconUrl: "https://images.pexels.com/photos/31525462/pexels-photo-31525462.jpeg" },
];

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
      if (!user) return;
            setLoading(true);
            try {
              // 1) Fetch stats
              const resStat = await fetch(`${API_URL}/api/userStat/${user.id}`);
              if (!resStat.ok) throw new Error(resStat.statusText);
              const d = await resStat.json();
              const stats: Stats = {
                achievements: d.numeroLogros || 0,
                friends: d.numeroAmigos || 0,
                createdPOI: d.numeroPoisCreados || 0,
                unlockedDistricts: d.numeroDistritosDesbloqueados || 0,
                collabMaps: d.numeroMapasColaborativos || 0,
              };
              // 2) Calcular km recorridos
              const km = stats.unlockedDistricts * 2;
              // 3) Filtrar logros desbloqueados
              const unlocked = allAchievements.filter((ach) => {
                const m = ach.description.match(/(\d+)/);
                const threshold = m ? parseInt(m[1], 10) : 1;
                const desc = ach.description.toLowerCase();
                if (desc.includes('punto')) return stats.createdPOI >= threshold;
                if (desc.includes('amigo')) return stats.friends >= threshold;
                if (desc.includes('kilómetro')) return km >= threshold;
                return false;
              });
              
                setAchievements(unlocked);
                setError(null);
              
            } catch (err) {
              console.error(err);
              setError("Error al obtener estadísticas o logros");
            } finally {
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
