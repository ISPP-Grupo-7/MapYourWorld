import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Colores de la aplicación
const APP_TEAL = '#009688';
const APP_DARK = '#333333';
const APP_TEAL_LIGHT = '#e6f3f1';
const APP_TEAL_DARK = '#2c7873';

interface TermsAndConditionsProps {
  isVisible: boolean;
  onClose: () => void;
  onAccept: () => void;
  alreadyRead?: boolean;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  isVisible,
  onClose,
  onAccept,
  alreadyRead = false
}) => {
  const [canAccept, setCanAccept] = useState(alreadyRead);
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Reset canAccept cuando el modal se cierra o si alreadyRead cambia
  useEffect(() => {
    if (!isVisible) {
      setCanAccept(alreadyRead);
      setScrollProgress(0);
    } else {
      // Si ya ha leído los términos, permitir aceptar de inmediato
      if (alreadyRead) {
        setCanAccept(true);
      }
      
      // Mostrar el indicador de progreso después de un breve retardo
      const timer = setTimeout(() => {
        setShowProgress(true);
      }, 1500);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, alreadyRead]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Guardamos las dimensiones para cálculos posteriores
    if (contentHeight === 0) {
      setContentHeight(contentSize.height);
    }
    
    if (scrollViewHeight === 0) {
      setScrollViewHeight(layoutMeasurement.height);
    }
    
    // Calculamos el progreso del scroll (0-100%)
    const calculatedProgress = Math.round((contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100);
    setScrollProgress(calculatedProgress);
    
    // Calculamos si estamos cerca del final del contenido
    // Siendo más permisivos (50px desde el final)
    const paddingToBottom = 50;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !canAccept) {
      console.log('Usuario ha llegado al final del documento');
      setCanAccept(true);
    }
  };

  // Implementamos también una forma alternativa para detectar el final
  const handleContentSizeChange = (contentWidth: number, height: number) => {
    setContentHeight(height);
  };

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
  };

  // Si el usuario hace scroll manualmente, comprobamos si está cerca del final
  const checkIfCloseToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
      // Al estar al final, activamos el botón después de un breve retardo
      setTimeout(() => {
        setCanAccept(true);
      }, 300);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Términos y Condiciones de Uso</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={APP_DARK} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16} // Más frecuente para mejor detección
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
          >
            <Text style={styles.sectionTitle}>Acuerdo de uso</Text>
            <Text style={styles.text}>
              Por favor, lee estos términos de uso antes de hacer uso de nuestra aplicación. Al acceder y usar el servicio admites haber leído, entendido y aceptado estos términos. Si no aceptas estas condiciones, no podrás acceder al servicio.
            </Text>
            <Text style={styles.text}>
              Estas condiciones de uso no son definitivas y pueden ser modificadas, en cuyo caso el uso continuado del servicio significará que has aceptado las nuevas condiciones de uso.
            </Text>
            <Text style={styles.text}>
              Estos términos afectan al uso de toda versión e iteración de MapYourWorld, esto incluye tanto las versiones online accesibles desde www.mapyourworld.es o mapyourworld.netlify.app como versiones nativas para dispositivos Android e iOS.
            </Text>

            <Text style={styles.sectionTitle}>1. Descripción del servicio</Text>
            <Text style={styles.text}>
              MapYourWorld es una aplicación innovadora que transforma la exploración del mundo en un juego interactivo. A medida que visitas nuevas ciudades, barrios o rincones escondidos, tu mapa personal se actualiza, desbloqueando logros y permitiéndote compartir tus aventuras con amigos. Con opciones gratuitas y premium, gamificación y mapas colaborativos, MapYourWorld convierte cada viaje en una experiencia única. MapYourWorld incluye funcionalidades de:
            </Text>
            <Text style={styles.listItem}>• Ver un mapa interactivo y personalizado que muestra tu progreso a tiempo real.</Text>
            <Text style={styles.listItem}>• Descubrir distritos a tiempo real.</Text>
            <Text style={styles.listItem}>• Registro de los distritos descubiertos.</Text>
            <Text style={styles.listItem}>• Descubrir puntos de interés cultural incluidos en el mapa.</Text>
            <Text style={styles.listItem}>• Crear tus propios puntos de interés.</Text>
            <Text style={styles.listItem}>• Conseguir logros definidos por la aplicación.</Text>
            <Text style={styles.listItem}>• Crear logros personalizados e individuales.</Text>
            <Text style={styles.listItem}>• Establecer una relación de amistad con otros usuarios.</Text>
            <Text style={styles.listItem}>• Crear mapas compartidos de hasta 6 jugadores en los que estos pueden descubrir distritos conjuntamente.</Text>
            <Text style={styles.listItem}>• Ser invitado a un mapa colaborativo de otro jugador.</Text>
            <Text style={styles.listItem}>• Visualizar tus estadísticas sobre distancia recorrida y mapa descubierto.</Text>
            <Text style={styles.listItem}>• Comparar tus estadísticas con las de otros jugadores.</Text>
            <Text style={styles.text}>
              Además, para empresas ajenas existe la posibilidad de promocionarse en nuestro mapa, creando un punto de interés visible a todos los usuarios.
            </Text>

            <Text style={styles.sectionTitle}>1.1. Política de precios</Text>
            <Text style={styles.text}>
              Aunque todas las funcionalidades previamente definidas estarán disponibles en la aplicación, están limitadas en función al plan del usuario:
            </Text>
            <Text style={styles.subSectionTitle}>Plan Básico (Gratis):</Text>
            <Text style={styles.listItem}>• Descubrir distritos a tiempo real: Incluido</Text>
            <Text style={styles.listItem}>• Descubrir puntos de interés incluidos en el mapa: Incluido</Text>
            <Text style={styles.listItem}>• Crear puntos de interés: Limitado a 1 por distrito</Text>
            <Text style={styles.listItem}>• Desbloquear logros predeterminados: Incluido</Text>
            <Text style={styles.listItem}>• Crear logros personalizados: No disponible</Text>
            <Text style={styles.listItem}>• Hacerte amigo de otro usuario: Incluido</Text>
            <Text style={styles.listItem}>• Crear mapas colaborativos con otros usuarios: No disponible</Text>
            <Text style={styles.listItem}>• Unirte a un mapa colaborativo: Limitado a 1 por usuario</Text>
            <Text style={styles.listItem}>• Ver tus estadísticas: No disponible</Text>
            <Text style={styles.listItem}>• Comparar tus estadísticas con las de otros usuarios: No disponible</Text>
            <Text style={styles.listItem}>• Interfaz sin anuncios estáticos: No incluido</Text>

            <Text style={styles.subSectionTitle}>Plan Premium (5.50 € / mes):</Text>
            <Text style={styles.listItem}>• Descubrir distritos a tiempo real: Incluido</Text>
            <Text style={styles.listItem}>• Descubrir puntos de interés incluidos en el mapa: Incluido</Text>
            <Text style={styles.listItem}>• Crear puntos de interés: Creación de puntos ilimitados</Text>
            <Text style={styles.listItem}>• Desbloquear logros predeterminados: Incluido</Text>
            <Text style={styles.listItem}>• Crear logros personalizados: Creación de logros ilimitados</Text>
            <Text style={styles.listItem}>• Hacerte amigo de otro usuario: Incluido</Text>
            <Text style={styles.listItem}>• Crear mapas colaborativos con otros usuarios: Creación de mapas ilimitados</Text>
            <Text style={styles.listItem}>• Unirte a un mapa colaborativo: No limitado</Text>
            <Text style={styles.listItem}>• Ver tus estadísticas: Incluido</Text>
            <Text style={styles.listItem}>• Comparar tus estadísticas con las de otros usuarios: Incluido</Text>
            <Text style={styles.listItem}>• Interfaz sin anuncios estáticos: Incluido</Text>

            <Text style={styles.text}>
              Para empresas que deseen publicitarse estas podrán ponerse en contacto con nosotros a través del formulario en mapyourworld.netlify.app o www.mapyoutworld.es.
            </Text>

            <Text style={styles.sectionTitle}>2. Uso del servicio</Text>
            <Text style={styles.text}>
              Debido a la gran importancia de la localización del usuario para utilizar nuestros servicios, el uso de MapYourWorld puede llegar a ser considerado peligroso por diversos factores como son el terreno y el tiempo. La existencia de un distrito o punto de interés no implica la seguridad o legalidad de llegar a este. Todos los riesgos que puedan surgir por usar MapYourWorld deben ser asumidos plenamente por el usuario.
            </Text>
            <Text style={styles.text}>
              De forma independiente, el uso del servicio implicará la adherencia a un código de conducta. Este código prohibe:
            </Text>
            <Text style={styles.listItem}>• Interferir con el uso del servicio o privacidad de cualquier otro usuario.</Text>
            <Text style={styles.listItem}>• Recopilar información personal de otros usuarios del servicio.</Text>
            <Text style={styles.listItem}>• Distribuir cualquier contenido que pueda considerarse abusivo, ilegal, indecente, ofensivo o amenazante.</Text>
            <Text style={styles.listItem}>• Distribuir cualquier contenido que anime a la violencia o el incumplimiento de cualquier ley, derechos de propiedad o copyright.</Text>
            <Text style={styles.listItem}>• Distribuir cualquier contenido que contenga un virus o cualquier componente software dañino.</Text>
            <Text style={styles.listItem}>• Descompilar o intentar extraer el código base del software asociado al producto.</Text>
            
            <Text style={styles.sectionTitle}>3. Acuerdo del nivel de servicio</Text>
            <Text style={styles.text}>
              El servicio depende de terceros para el acceso de los usuarios a este y para su correcto funcionamiento. Es por esto que MapYourWorld considerará algunos indicadores de servicios propios y otros externos, quedando extentos de responsabilidad por fallos de terceros, aunque se considerará la situación y se ofrecerán las compensaciones que se consideren necesarias y adecuadas, según lo establecido en el punto 3.2.
            </Text>
            <Text style={styles.text}>
              Este acuerdo será revisado cuatrimestralmente para que los objetivos internos se mantengan realistas y alcanzables. De forma puntual, si algún tercero del que el servicio depende modificara en mayor o menor medida sus acuerdo de nivel de servicio, MapYourWorld modificaría de forma acorde los objetivos definidos a continuación.
            </Text>

            <Text style={styles.sectionTitle}>3.1. Indicadores y objetivos del nivel de servicio</Text>
            <Text style={styles.text}>Los indicadores y objetivos del nivel de servicio son:</Text>
            <Text style={styles.listItem}>• Latencia: 95% de las llamadas con un tiempo de respuesta menor o igual a 0,3s (interno), 95% de las llamadas con un tiempo de respuesta menor o igual a 1s (terceros).</Text>
            <Text style={styles.listItem}>• Rendimiento: Soportar hasta 40 transacciones por segundo (interno), alrededor de 50 transacciones por segundo (terceros).</Text>
            <Text style={styles.listItem}>• Disponibilidad: Disponibilidad del 95%, considerando las dependencias a terceros (interno), alrededor de un 95% de disponibilidad (terceros).</Text>
            <Text style={styles.listItem}>• Índice de error: Índice interno menor de un 1% por el número total de llamadas, siendo el índice combinado menor de un 2% (interno), índices que no superen un 2% (terceros).</Text>
            <Text style={styles.listItem}>• Durabilidad: Durabilidad interna combinada del 95% (interno), una durabilidad del 99% (terceros).</Text>
            <Text style={styles.listItem}>• Exactitud de datos: Mantener un 98% de precisión combinada, un 99% interna (interno), mantener un 98% de exactitud (terceros).</Text>
            <Text style={styles.listItem}>• Exactitud de localización: Depende íntegramente de terceros. En versiones nativas, un margen de exactitud de 15m, mientras que en versiones web de hasta 500m debido a la naturaleza inexacta de la localización web.</Text>

            <Text style={styles.sectionTitle}>3.2. Cláusulas de compensación</Text>
            <Text style={styles.text}>
              El equipo será responsable de mantener el servicio dentro de los objetivos establecidos y corregirá cualquier desviación que ocurra, dentro de lo posible. Debido a la alta dependencia en terceros, si estos notifican de cualquier impedimento que les impida adherirse a sus acuerdos de nivel de servicio, MapYourWorld se encargará de notificar a sus usuarios. Sin embargo, si ocurre algún imprevisto que imposibilite la calidad del servicio, MapYourWorld no se responsabilizará de estas pérdidas aunque sí considere las siguientes cláusulas de compensación para usuarios de planes base y premium.
            </Text>
            <Text style={styles.text}>
              A los usuarios de plan básico, debido a que MapYourWorld no ofrece un bien básico y necesario y a la gratuidad del servicio, MapYourWorld no ofrecerá ningún tipo de compensación por falta de disponibilidad o gestión errónea de los datos.
            </Text>
            <Text style={styles.text}>
              A los usuarios de plan premium, la incidencia se resolverá de forma diferente atendiendo al tipo de incidencia, ya sea falta de disponibilidad o incumplimiento de la política de privacidad, ofreciendo un descuento de hasta un 50% del siguiente pago del plan o hasta un reembolso, si se considera que el incumplimiento del acuerdo de confidencialidad ha sido de mayor calibre.
            </Text>
            <Text style={styles.text}>
              Si el usuario considera que MapYourWorld ha podido ocasionar daños directos hacia su persona, este podrá ponerse en contacto con MapYourWorld a través del correo mapyourworld.group7@gmail.com exponiendo de buena fe dichos daños y una propuesta de compensación. MapYourWorld considerará la propuesta y se comprometerá a responder en un plazo de 30 días.
            </Text>

            <Text style={styles.sectionTitle}>4. Cuentas de usuario</Text>
            <Text style={styles.text}>
              Existe la opción de usar MapYourWorld mediante una cuenta invitado que no necesitará de datos personales. Sin embargo esta opción estará muy limitada debido a la naturaleza del producto. Para poder disfrutar de todas las funcionalidades de la aplicación será necesario registrarse ofreciendo un correo electrónico válido.
            </Text>

            <Text style={styles.sectionTitle}>5. Política de privacidad</Text>
            <Text style={styles.text}>
              Este punto tratará la información con la que trabaja MapYourWorld, cómo se usa esta información, si se comparte y cómo, cómo contactarnos sobre tu información y los derechos que todo usuario tendrá con respecto a su información.
            </Text>

            <Text style={styles.sectionTitle}>5.1. Información recopilada y generada por la aplicación</Text>
            <Text style={styles.text}>MapYourWorld recogerá la siguiente información:</Text>
            <Text style={styles.listItem}>• Información de perfil: esto incluye correo electrónico, nombre y apellidos, nombre de usuario y una contraseña asociada a estos además del plan al que está sujeto el usuario.</Text>
            <Text style={styles.listItem}>• Información de ubicación: la ubicación a tiempo real no será recogida, lo que sí se recogerá de forma persistente serán los distritos descubiertos por el usuario.</Text>
            <Text style={styles.listItem}>• Información de puntos de interés: al crear un puntos de interés se guardará cualquier foto incluida, nombre y descripción proporcionada por el usuario.</Text>
            <Text style={styles.listItem}>• Información de logros: los logros desbloqueados por el usuario y cualquier logro personalizado que se haya creado.</Text>
            <Text style={styles.listItem}>• Información de amistades: los amigos del usuario y los mapas colaborativos a los que pertenece.</Text>

            <Text style={styles.sectionTitle}>5.2. Uso de la información</Text>
            <Text style={styles.text}>
              La información geográfica recogida se utilizará única y exclusivamente para el módulo estadístico y de logros incluidos en el propio servicio. Toda información recogida o generada por MapYourWorld será de uso exclusivo por MapYourWorld y no serán compartidos ni accesibles por ninguna organización ni persona ajenas al equipo de MapYourWorld.
            </Text>

            <Text style={styles.sectionTitle}>5.3. Seguridad de los datos</Text>
            <Text style={styles.text}>
              Implementamos medidas de seguridad técnicas y administrativas diseñadas para proteger la información personal de los usuarios para protegerla de accesos no autorizados o uso inadecuado. Sin embargo, toda medida de seguridad es imperfecta y penetrable, a pesar de nuestros mejores esfuerzos.
            </Text>

            <Text style={styles.sectionTitle}>5.4. Datos de contacto y derechos de los usuarios</Text>
            <Text style={styles.text}>
              Al estar sujetos a la LOPDGDD, todo usuario tiene una serie de derechos con respecto a sus datos. Para cualquier contacto con el equipo, contáctanos mediante la dirección mapyourworld.group7@gmail.com y para comprobar todo los derechos de los usuarios, dirigirse al capítulo 2 de la LOPDGDD, un enlace a la misma puede encontrarse en el apartado 10.
            </Text>

            <Text style={styles.sectionTitle}>6. Subscripción premium e información de pagos</Text>
            <Text style={styles.text}>
              El plan premium definido en la Política de precios será únicamente obtenible a través de las aplicaciones y productos oficiales de MapYourWorld y este no se hace responsable de cualquier fraude que pueda ocurrir por parte de terceros.
            </Text>
            <Text style={styles.text}>
              Cuando se produzcan cambios en el servicio, si estos cambios son menores y no afectan a las funcionalidades ofrecidas para los usuarios premium estos no serán notificados. Sin embargo, si se realizan cambios significativos al servicio, todo usuario premium serán notificados con antelación, dándoles la oportunidad de no renovar la subscripción si este lo considera adecuado.
            </Text>
            <Text style={styles.text}>
              El procesado de la subscripción se realizará a través de Stripe que tiene una política de privacidad y términos de uso propios.
            </Text>
            <Text style={styles.text}>
              MapYourWorld no recogerá información sobre los métodos de pago sino sobre un historial de planes que podrá ser consultado por el usuario poniéndose en contacto con nuestro equipo a través del correo mapyourworld.group7@gmail.com.
            </Text>

            <Text style={styles.sectionTitle}>7. Propiedad intelectual</Text>
            <Text style={styles.text}>
              Salvo que se indique lo contrario, todo contenido del servicio, incluido artículos, ilustraciones, capturas, gráficos, logos y otros archivos son propiedad de MapYourWorld y está protegido por las leyes de propiedad intelectual correspondientes. Si crees que algún fragmento del servicio infringe tu copyright y quieres notificarnos, hazlo a través del correo mapyourworld.group7@gmail.com con la siguiente información:
            </Text>
            <Text style={styles.listItem}>• Una descripción del producto con copyright o cualquier otra propiedad intelectual presuntamente infringida.</Text>
            <Text style={styles.listItem}>• Identificar el material que está presuntamente infringiendo dicho copyright, incluyendo una descripción de dónde está ubicado en toda versión del servicio.</Text>
            <Text style={styles.listItem}>• Un correo a través el cual podamos ponernos en contacto, si el usado para mandar la notificación no va a estar disponible.</Text>
            <Text style={styles.listItem}>• Si estás representando a una tercera parte, quiénes son.</Text>
            <Text style={styles.listItem}>• Una declaración firmada en la que se declare que la información anterior es correcta y la creencia en buena fe que el uso del material con copyright no ha sido autorizado por el propietario del copyright, su agente o la ley.</Text>

            <Text style={styles.sectionTitle}>8. Terminación</Text>
            <Text style={styles.text}>
              MapYourWorld se reserva la posibilidad de suspender o terminar la cuenta de cualquier usuario si se considera que se ha violado cuualquiera de los términos de este acuerdo. En función de la situación de la que se trate, especialmente si el usuario no ha puesto en peligro a ningún usuario ni a sus datos, se le dará al usuario una oportunidad para corregir su falta antes de la suspensión o terminación.
            </Text>
            <Text style={styles.text}>
              Todo usuario puede dejar de usar los servicios de MapYourWorld y terminar los términos de este acuerdo salvo aquellas cláusulas sin limitación, que incluye las cláusulas de Propiedad intelectual y Limitación de liabilidad.
            </Text>

            <Text style={styles.sectionTitle}>9. Limitación a la liabilidad</Text>
            <Text style={styles.text}>
              Hasta donde lo permita la ley, los miembros del equipo de MapYourWorld no serán liables por ningún daño o perjuicio ya sea directo o indirecto, pérdida de beneficios, ingresos o datos que puedan producirse por el uso de MapYourWorld y este acuerdo de uso. Si un tribunal determinase que esta limitación no es legalmente válida, a la medida permitida por la ley, la máxima liabilidad a la que están sujetos los miembros del equipo de MapYourWorld por cualquier demanda que surja por el uso de nuestro servicio estará limitado a la cantidad pagada por el uso del servicio o los daños directos ocasionados por este.
            </Text>

            <Text style={styles.sectionTitle}>9.1. Productos y servicios de terceros</Text>
            <Text style={styles.text}>
              El servicio puede contener vínculos a redes, servicios o plataformas que no están controladas por MapYourWorld. No nos hacemos responsables del contenido de un producto externo, inclusive el contenido de un distribuidor incluido con consentimiento de MapYourWorld. Tampoco nos hacemos responsables de mantener los materiales referenciados y la presencia en el servicio no implica que el producto esté disponible y sea fiel a lo mostrado.
            </Text>

            <Text style={styles.sectionTitle}>10. Leyes gobernantes</Text>
            <Text style={styles.text}>
              MapYourWorld se encuentra bajo la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos y Garantía de los Derechos Digitales (LOPDGDD) que toma de referencia el Reglamento General de Protección de Datos (RGPD) publicado por la Unión Europea.
            </Text>
            <Text style={styles.text}>
              Cualquier demanda será tramitada ante la Jurisdicción de lo Contencioso-Administrativo o de lo Civil, en función de las competencias de dicha demanda.
            </Text>

            {/* Al final del documento añadimos un marcador */}
            <View style={styles.scrollEndSpace}>
              {/* El botón "Ir al final" ha sido eliminado */}
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            {/* Indicador de progreso flotante */}
            {showProgress && !canAccept && (
              <View style={styles.progressIndicator}>
                <Text style={styles.progressText}>{scrollProgress}% leído</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${scrollProgress}%` }]} />
                </View>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.declineButton}>
              <Text style={styles.declineButtonText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onAccept} 
              style={[
                styles.acceptButton,
                !canAccept && styles.disabledButton
              ]}
              disabled={!canAccept}
            >
              <Text style={[
                styles.acceptButtonText,
                !canAccept && styles.disabledButtonText
              ]}>
                Aceptar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: isTablet ? '70%' : '90%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_TEAL,
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    flex: 1,
  },
  scrollEndSpace: {
    height: 60,
    marginTop: 20,
  },
  scrollToBottomButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginBottom: 20,
  },
  scrollToBottomText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: APP_TEAL,
    padding: 12,
    width: '100%',
    backgroundColor: APP_TEAL_LIGHT,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: APP_TEAL,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: APP_TEAL_DARK,
    padding: 10,
    backgroundColor: `${APP_TEAL_LIGHT}80`,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: APP_TEAL,
    width: '100%',
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
    color: APP_TEAL_DARK,
    fontWeight: 'bold',
    backgroundColor: APP_TEAL_LIGHT,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: APP_TEAL,
    width: '100%',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#444',
    textAlign: 'justify',
    width: '100%',
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 0,
    marginBottom: 8,
    color: '#444',
    paddingLeft: 18,
    paddingRight: 5,
    textAlign: 'justify',
    width: '100%',
    flexShrink: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: APP_TEAL,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  declineButtonText: {
    color: '#777',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  disabledButtonText: {
    color: '#888888',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    width: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: APP_TEAL,
    borderRadius: 4,
  },
});

export default TermsAndConditions; 