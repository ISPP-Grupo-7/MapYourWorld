import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { 
  COOKIE_NAMES, 
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
  console.log('Inicializando CookieBanner móvil...');
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<CookieConsentOptions>({...DEFAULT_CONSENT});
  const [debugEnabled, setDebugEnabled] = useState(DEBUG_MODE);

  useEffect(() => {
    const checkCookieConsent = async () => {
      try {
        console.log('Verificando consentimiento de cookies (móvil)...');
        // Verificar si el modo debug está activado (ya sea por la constante global o por localStorage/AsyncStorage)
        const savedDebugMode = await isDebugMode();
        const finalDebugMode = DEBUG_MODE || savedDebugMode;
        console.log('Modo debug (móvil):', finalDebugMode);
        setDebugEnabled(finalDebugMode);
        
        // En modo debug, siempre mostrar el banner
        if (finalDebugMode) {
          console.log('Modo debug activo, mostrando banner (móvil)...');
          setVisible(true);
          return;
        }
        
        // Comportamiento normal sin debug
        const consent = await hasCookieConsent();
        console.log('Consentimiento actual (móvil):', consent);
        if (consent === null) {
          console.log('No hay consentimiento previo, mostrando banner (móvil)...');
          setVisible(true);
        } else {
          console.log('Hay consentimiento previo, ocultando banner (móvil)');
          setVisible(false);
        }
      } catch (error) {
        console.error('Error al verificar consentimiento de cookies (móvil):', error);
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
      console.log('Aceptando todas las cookies (móvil)...');
      const allOptions: CookieConsentOptions = {
        essential: true,
        analytics: true,
        marketing: true,
        preferences: true
      };
      
      await setCookieConsentOptions(allOptions);
      console.log('Cookies guardadas, actualizando UI (móvil)...');
      // Forzamos cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al aceptar, incluso en modo debug
      console.log('Ocultando banner (móvil)...');
      setVisible(false);
      
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Error al guardar consentimiento de cookies (móvil):', error);
    }
  };

  const handleAcceptSelected = async () => {
    try {
      console.log('Guardando preferencias seleccionadas (móvil)...');
      await setCookieConsentOptions(options);
      console.log('Preferencias guardadas, actualizando UI (móvil)...');
      // Forzamos cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al aceptar, incluso en modo debug
      console.log('Ocultando banner (móvil)...');
      setVisible(false);
      
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Error al guardar consentimiento de cookies (móvil):', error);
    }
  };

  const handleReject = async () => {
    try {
      console.log('Guardando solo cookies esenciales (móvil)...');
      await setCookieConsentOptions(DEFAULT_CONSENT);
      console.log('Cookies guardadas, actualizando UI (móvil)...');
      // Forzamos cerrar siempre el panel expandido, si estuviera abierto
      setExpanded(false);
      
      // Siempre ocultamos el banner al rechazar, incluso en modo debug
      console.log('Ocultando banner (móvil)...');
      setVisible(false);
      
      if (onReject) onReject();
    } catch (error) {
      console.error('Error al guardar rechazo de cookies (móvil):', error);
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
              <Text style={styles.debugLabel}>Debug:</Text>
              <Switch 
                value={debugEnabled}
                onValueChange={handleDebugToggle}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleResetCookies}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.title}>Uso de cookies</Text>
        <Text style={styles.description}>
          Utilizamos cookies para mejorar tu experiencia, mostrar contenido personalizado
          y analizar el tráfico.
        </Text>
        
        {expanded && (
          <ScrollView style={styles.optionsContainer} contentContainerStyle={styles.optionsContent}>
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Esenciales</Text>
                <Text style={styles.optionDescription}>
                  Necesarias para el funcionamiento básico.
                </Text>
              </View>
              <Switch value={true} disabled={true} />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Analíticas</Text>
                <Text style={styles.optionDescription}>
                  Mejoran la experiencia de usuario.
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
                  Muestran anuncios relevantes.
                </Text>
              </View>
              <Switch 
                value={options.marketing} 
                onValueChange={() => toggleOption('marketing')} 
              />
            </View>
            
            <View style={[styles.optionItem, {borderBottomWidth: 0}]}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Preferencias</Text>
                <Text style={styles.optionDescription}>
                  Recuerdan tus preferencias.
                </Text>
              </View>
              <Switch 
                value={options.preferences} 
                onValueChange={() => toggleOption('preferences')} 
              />
            </View>
          </ScrollView>
        )}
        
        <View style={styles.buttonContainer}>
          {!expanded ? (
            <>
              <TouchableOpacity 
                style={styles.expandButton} 
                onPress={() => {
                  console.log('Click en botón Personalizar (móvil)');
                  setExpanded(true);
                }}
              >
                <Text style={styles.expandButtonText}>Personalizar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => {
                  console.log('Click en botón Solo esenciales (móvil)');
                  handleReject();
                }}
              >
                <Text style={styles.rejectButtonText}>Solo esenciales</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => {
                  console.log('Click en botón Aceptar todas (móvil)');
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
                  console.log('Click en botón Solo esenciales expandido (móvil)');
                  handleReject();
                }}
              >
                <Text style={styles.rejectButtonText}>Solo esenciales</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => {
                  console.log('Click en botón Guardar preferencias (móvil)');
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
    padding: 10,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e293b',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  optionsContainer: {
    maxHeight: 200,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
  },
  optionsContent: {
    padding: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  optionDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  expandButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#334155',
    fontSize: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#14b8a6',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#334155',
    fontSize: 12,
  },
  // Estilos para los controles de depuración
  debugControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 11,
    color: '#334155',
    marginRight: 6,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CookieBanner; 