import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { 
  hasCookieConsent, 
  setCookieConsentOptions, 
  CookieConsentOptions, 
  DEFAULT_CONSENT,
  setDebugMode,
  isDebugMode,
  resetAllCookies,
  DEBUG_MODE
} from '../../utils/cookies';

type CookieBannerProps = {
  onAccept?: () => void;
  onReject?: () => void;
};

const CookieBanner = ({ onAccept, onReject }: CookieBannerProps) => {
  console.log('Inicializando CookieBanner...');
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<CookieConsentOptions>({...DEFAULT_CONSENT});
  const [debugEnabled, setDebugEnabled] = useState(DEBUG_MODE);

  useEffect(() => {
    const checkCookieConsent = async () => {
      try {
        console.log('Verificando consentimiento de cookies...');
        // Verificar si el modo debug está activado (ya sea por la constante global o por localStorage/AsyncStorage)
        const savedDebugMode = await isDebugMode();
        const finalDebugMode = DEBUG_MODE || savedDebugMode;
        console.log('Modo debug:', finalDebugMode);
        setDebugEnabled(finalDebugMode);
        
        // En modo debug, siempre mostrar el banner
        if (finalDebugMode) {
          console.log('Modo debug activo, mostrando banner...');
          setVisible(true);
          return;
        }
        
        // Comportamiento normal sin debug
        const consent = await hasCookieConsent();
        console.log('Consentimiento actual:', consent);
        if (consent === null) {
          console.log('No hay consentimiento previo, mostrando banner...');
          setVisible(true);
        } else {
          console.log('Hay consentimiento previo, ocultando banner');
          setVisible(false);
        }
      } catch (error) {
        console.error('Error al verificar consentimiento de cookies:', error);
      }
    };

    checkCookieConsent();
    
    // Inicializar el estado de debug
    setDebugMode(DEBUG_MODE);
  }, []);

  const handleDebugToggle = async () => {
    const newState = !debugEnabled;
    setDebugEnabled(newState);
    await setDebugMode(newState);
    
    // En modo debug, siempre mostramos el banner
    if (newState) {
      setVisible(true);
    } else {
      // Cuando desactivamos el modo debug, comprobamos el estado real del consentimiento
      const consent = await hasCookieConsent();
      setVisible(consent === null);
    }
  };

  const handleResetCookies = async () => {
    await resetAllCookies();
    setOptions({...DEFAULT_CONSENT});
    setVisible(true);
  };

  const handleAcceptAll = async () => {
    try {
      console.log('Aceptando todas las cookies...');
      const allOptions: CookieConsentOptions = {
        essential: true,
        analytics: true,
        marketing: true,
        preferences: true
      };
      
      await setCookieConsentOptions(allOptions);
      console.log('Cookies guardadas, actualizando UI...');
      // Cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al aceptar, incluso en modo debug
      console.log('Ocultando banner...');
      setVisible(false);
      
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Error al guardar consentimiento de cookies:', error);
    }
  };

  const handleAcceptSelected = async () => {
    try {
      console.log('Guardando preferencias seleccionadas...');
      await setCookieConsentOptions(options);
      console.log('Preferencias guardadas, actualizando UI...');
      // Forzamos cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al aceptar, incluso en modo debug
      console.log('Ocultando banner...');
      setVisible(false);
      
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Error al guardar consentimiento de cookies:', error);
    }
  };

  const handleReject = async () => {
    try {
      console.log('Guardando solo cookies esenciales...');
      await setCookieConsentOptions(DEFAULT_CONSENT);
      console.log('Cookies guardadas, actualizando UI...');
      // Forzamos cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al rechazar, incluso en modo debug
      console.log('Ocultando banner...');
      setVisible(false);
      
      if (onReject) onReject();
    } catch (error) {
      console.error('Error al guardar rechazo de cookies:', error);
    }
  };

  const toggleOption = (option: keyof CookieConsentOptions) => {
    if (option === 'essential') return; // No se puede desactivar
    
    setOptions({
      ...options,
      [option]: !options[option]
    });
  };

  if (!visible) {
    // En lugar de mostrar un botón flotante, no mostramos nada
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Controles de depuración - Solo visibles si DEBUG_MODE está activado */}
        {DEBUG_MODE && (
          <View style={styles.debugControls}>
            <View style={styles.debugToggleContainer}>
              <Text style={styles.debugLabel}>Modo Debug:</Text>
              <Switch 
                value={debugEnabled}
                onValueChange={handleDebugToggle}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleResetCookies}
            >
              <Text style={styles.resetButtonText}>Resetear Cookies</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.title}>Uso de cookies</Text>
        <Text style={styles.description}>
          Utilizamos cookies para mejorar tu experiencia, mostrar contenido personalizado
          y analizar el tráfico. Al aceptar, consientes el uso de cookies para estos fines.
        </Text>
        
        {expanded && (
          <View style={styles.optionsContainer}>
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Esenciales</Text>
                <Text style={styles.optionDescription}>
                  Necesarias para el funcionamiento básico del sitio. No se pueden desactivar.
                </Text>
              </View>
              <Switch value={true} disabled={true} />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Analíticas</Text>
                <Text style={styles.optionDescription}>
                  Nos ayudan a entender cómo utilizas el sitio y mejorar la experiencia.
                </Text>
              </View>
              <Switch 
                value={options.analytics} 
                onValueChange={() => toggleOption('analytics')} 
              />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Marketing</Text>
                <Text style={styles.optionDescription}>
                  Utilizadas para mostrarte anuncios relevantes dentro y fuera del sitio.
                </Text>
              </View>
              <Switch 
                value={options.marketing} 
                onValueChange={() => toggleOption('marketing')} 
              />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Preferencias</Text>
                <Text style={styles.optionDescription}>
                  Permiten recordar tus preferencias para personalizar tu experiencia.
                </Text>
              </View>
              <Switch 
                value={options.preferences} 
                onValueChange={() => toggleOption('preferences')} 
              />
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          {!expanded ? (
            <>
              <TouchableOpacity 
                style={styles.expandButton} 
                onPress={() => {
                  console.log('Click en botón Personalizar');
                  setExpanded(true);
                }}
              >
                <Text style={styles.expandButtonText}>Personalizar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => {
                  console.log('Click en botón Solo esenciales');
                  handleReject();
                }}
              >
                <Text style={styles.rejectButtonText}>Solo esenciales</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => {
                  console.log('Click en botón Aceptar todas');
                  handleAcceptAll();
                }}
              >
                <Text style={styles.acceptButtonText}>Aceptar todas</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => {
                  console.log('Click en botón Solo esenciales (expandido)');
                  handleReject();
                }}
              >
                <Text style={styles.rejectButtonText}>Solo esenciales</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => {
                  console.log('Click en botón Guardar preferencias');
                  handleAcceptSelected();
                }}
              >
                <Text style={styles.acceptButtonText}>Guardar preferencias</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
    padding: 15,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    maxWidth: 480,
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  expandButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#334155',
    fontSize: 14,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#14b8a6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#334155',
    fontSize: 14,
  },
  // Estilos para los controles de depuración
  debugControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#64748b',
  },
  debugToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugLabel: {
    fontSize: 12,
    color: '#334155',
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CookieBanner; 