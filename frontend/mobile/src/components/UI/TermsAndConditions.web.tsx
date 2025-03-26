import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components';

// Colores de la aplicación - mismas tonalidades que en la versión móvil
const APP_TEAL = '#009688';
const APP_DARK = '#333333';
const APP_LIGHT = '#f5f5f5';
const APP_TEAL_LIGHT = '#e6f3f1';
const APP_TEAL_DARK = '#2c7873';

// Componentes estilizados para la versión web
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 1;
  transition: opacity 0.3s;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  width: 90%;
  max-width: 1000px;
  height: 85%;
  max-height: 800px;
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s, transform 0.3s;
  margin-top: 50px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${APP_TEAL};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;

const ContentContainer = styled.div`
  padding: 30px;
  flex: 1;
  overflow: auto;
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${APP_TEAL}80;
    border-radius: 5px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${APP_TEAL};
  }
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

const SectionTitle = styled.h3`
  color: ${APP_TEAL};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 15px 20px;
  margin-top: 40px;
  margin-bottom: 25px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.7px;
  position: relative;
  width: 100%;
  background-color: ${APP_TEAL_LIGHT};
  border-radius: 8px;
  border-left: 4px solid ${APP_TEAL};
`;

const SubSectionTitle = styled.h4`
  color: ${APP_TEAL_DARK};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin-top: 25px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  padding: 10px 15px;
  border-left: 4px solid ${APP_TEAL};
  width: 100%;
  background-color: ${APP_TEAL_LIGHT}80;
  border-radius: 6px;
`;

const Paragraph = styled.p`
  color: #444;
  line-height: 1.7;
  margin-bottom: 20px;
  font-size: 16px;
  text-align: justify;
  hyphens: auto;
  width: 100%;
`;

const List = styled.ul`
  padding-left: 0;
  margin-bottom: 25px;
  width: 100%;
  list-style: none;
`;

const ListItem = styled.li`
  margin-bottom: 12px;
  line-height: 1.7;
  font-size: 16px;
  text-align: justify;
  width: 100%;
  display: block;
  padding-left: 1.5em;
  position: relative;
  
  &::before {
    content: '•';
    color: ${APP_TEAL};
    font-weight: bold;
    position: absolute;
    left: 0.5em;
    top: 0;
    font-size: 18px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 30px;
  border-top: 1px solid #e0e0e0;
`;

const DeclineButton = styled.button`
  background-color: ${APP_LIGHT};
  padding: 14px 25px;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  color: #777;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e6e6e6;
  }
`;

const AcceptButton = styled.button`
  background-color: ${props => props.disabled ? '#cccccc' : APP_TEAL};
  padding: 14px 25px;
  border-radius: 8px;
  border: none;
  margin-top: 15px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: bold;
  font-size: 16px;
  color: ${props => props.disabled ? '#888888' : 'white'};
  transition: background-color 0.2s, transform 0.1s;
  &:hover {
    background-color: ${props => props.disabled ? '#cccccc' : '#007d6e'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: center;
`;

const ProgressText = styled.span`
  color: #666;
  font-size: 15px;
  margin-right: 15px;
`;

const ProgressBar = styled.div`
  width: 150px;
  height: 10px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  margin-left: 15px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: ${APP_TEAL};
  border-radius: 5px;
  transition: width 0.3s;
`;

const ScrollToBottom = styled.button`
  background-color: ${APP_TEAL};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 20px;
  margin-bottom: 40px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, background-color 0.2s;
  &:hover {
    transform: translateY(-2px);
    background-color: #007d6e;
  }
`;

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showBottomPrompt, setShowBottomPrompt] = useState(false);

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

      // Mostrar prompt para scroll después de un tiempo
      const bottomPromptTimer = setTimeout(() => {
        setShowBottomPrompt(true);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(bottomPromptTimer);
      };
    }
  }, [isVisible, alreadyRead]);

  const handleScroll = () => {
    if (!contentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    
    // Calculamos el progreso del scroll (0-100%)
    const calculatedProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setScrollProgress(calculatedProgress);
    
    // Si el progreso es más del 95%, consideramos que ha llegado al final
    if (calculatedProgress > 95 && !canAccept) {
      setCanAccept(true);
      console.log('Usuario ha llegado al final del documento');
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Usamos un div en lugar de un Modal nativo para mejor compatibilidad web
  if (!isVisible) return null;
  
  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>Términos y Condiciones de Uso</ModalTitle>
          <CloseButton onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke={APP_DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke={APP_DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CloseButton>
        </ModalHeader>
        
        <ContentContainer 
          ref={contentRef}
          onScroll={handleScroll}
        >
          <ContentWrapper>
            <SectionTitle>Acuerdo de uso</SectionTitle>
            <Paragraph>
              Por favor, lee estos términos de uso antes de hacer uso de nuestra aplicación. Al acceder y usar el servicio admites haber leído, entendido y aceptado estos términos. Si no aceptas estas condiciones, no podrás acceder al servicio.
            </Paragraph>
            <Paragraph>
              Estas condiciones de uso no son definitivas y pueden ser modificadas, en cuyo caso el uso continuado del servicio significará que has aceptado las nuevas condiciones de uso.
            </Paragraph>
            <Paragraph>
              Estos términos afectan al uso de toda versión e iteración de MapYourWorld, esto incluye tanto las versiones online accesibles desde www.mapyourworld.es o mapyourworld.netlify.app como versiones nativas para dispositivos Android e iOS.
            </Paragraph>

            <SectionTitle>1. Descripción del servicio</SectionTitle>
            <Paragraph>
              MapYourWorld es una aplicación innovadora que transforma la exploración del mundo en un juego interactivo. A medida que visitas nuevas ciudades, barrios o rincones escondidos, tu mapa personal se actualiza, desbloqueando logros y permitiéndote compartir tus aventuras con amigos. Con opciones gratuitas y premium, gamificación y mapas colaborativos, MapYourWorld convierte cada viaje en una experiencia única.
            </Paragraph>
            <Paragraph>MapYourWorld incluye funcionalidades de:</Paragraph>
            <List>
              <ListItem>Ver un mapa interactivo y personalizado que muestra tu progreso a tiempo real.</ListItem>
              <ListItem>Descubrir distritos a tiempo real.</ListItem>
              <ListItem>Registro de los distritos descubiertos.</ListItem>
              <ListItem>Descubrir puntos de interés cultural incluidos en el mapa.</ListItem>
              <ListItem>Crear tus propios puntos de interés.</ListItem>
              <ListItem>Conseguir logros definidos por la aplicación.</ListItem>
              <ListItem>Crear logros personalizados e individuales.</ListItem>
              <ListItem>Establecer una relación de amistad con otros usuarios.</ListItem>
              <ListItem>Crear mapas compartidos de hasta 6 jugadores en los que estos pueden descubrir distritos conjuntamente.</ListItem>
              <ListItem>Ser invitado a un mapa colaborativo de otro jugador.</ListItem>
              <ListItem>Visualizar tus estadísticas sobre distancia recorrida y mapa descubierto.</ListItem>
              <ListItem>Comparar tus estadísticas con las de otros jugadores.</ListItem>
            </List>
            <Paragraph>
              Además, para empresas ajenas existe la posibilidad de promocionarse en nuestro mapa, creando un punto de interés visible a todos los usuarios.
            </Paragraph>

            <SectionTitle>1.1. Política de precios</SectionTitle>
            <Paragraph>Aunque todas las funcionalidades previamente definidas estarán disponibles en la aplicación, están limitadas en función al plan del usuario:</Paragraph>
            
            <SubSectionTitle>Plan Básico (Gratis):</SubSectionTitle>
            <List>
              <ListItem>Descubrir distritos a tiempo real: Incluido</ListItem>
              <ListItem>Descubrir puntos de interés incluidos en el mapa: Incluido</ListItem>
              <ListItem>Crear puntos de interés: Limitado a 1 por distrito</ListItem>
              <ListItem>Desbloquear logros predeterminados: Incluido</ListItem>
              <ListItem>Crear logros personalizados: No disponible</ListItem>
              <ListItem>Hacerte amigo de otro usuario: Incluido</ListItem>
              <ListItem>Crear mapas colaborativos con otros usuarios: No disponible</ListItem>
              <ListItem>Unirte a un mapa colaborativo: Limitado a 1 por usuario</ListItem>
              <ListItem>Ver tus estadísticas: No disponible</ListItem>
              <ListItem>Comparar tus estadísticas con las de otros usuarios: No disponible</ListItem>
              <ListItem>Interfaz sin anuncios estáticos: No incluido</ListItem>
            </List>

            <SubSectionTitle>Plan Premium (5.50 € / mes):</SubSectionTitle>
            <List>
              <ListItem>Descubrir distritos a tiempo real: Incluido</ListItem>
              <ListItem>Descubrir puntos de interés incluidos en el mapa: Incluido</ListItem>
              <ListItem>Crear puntos de interés: Creación de puntos ilimitados</ListItem>
              <ListItem>Desbloquear logros predeterminados: Incluido</ListItem>
              <ListItem>Crear logros personalizados: Creación de logros ilimitados</ListItem>
              <ListItem>Hacerte amigo de otro usuario: Incluido</ListItem>
              <ListItem>Crear mapas colaborativos con otros usuarios: Creación de mapas ilimitados</ListItem>
              <ListItem>Unirte a un mapa colaborativo: No limitado</ListItem>
              <ListItem>Ver tus estadísticas: Incluido</ListItem>
              <ListItem>Comparar tus estadísticas con las de otros usuarios: Incluido</ListItem>
              <ListItem>Interfaz sin anuncios estáticos: Incluido</ListItem>
            </List>

            <Paragraph>
              Para empresas que deseen publicitarse estas podrán ponerse en contacto con nosotros a través del formulario en mapyourworld.netlify.app o www.mapyoutworld.es.
            </Paragraph>

            <SectionTitle>2. Uso del servicio</SectionTitle>
            <Paragraph>
              Debido a la gran importancia de la localización del usuario para utilizar nuestros servicios, el uso de MapYourWorld puede llegar a ser considerado peligroso por diversos factores como son el terreno y el tiempo. La existencia de un distrito o punto de interés no implica la seguridad o legalidad de llegar a este. Todos los riesgos que puedan surgir por usar MapYourWorld deben ser asumidos plenamente por el usuario.
            </Paragraph>
            <Paragraph>De forma independiente, el uso del servicio implicará la adherencia a un código de conducta. Este código prohibe:</Paragraph>
            <List>
              <ListItem>Interferir con el uso del servicio o privacidad de cualquier otro usuario.</ListItem>
              <ListItem>Recopilar información personal de otros usuarios del servicio.</ListItem>
              <ListItem>Distribuir cualquier contenido que pueda considerarse abusivo, ilegal, indecente, ofensivo o amenazante.</ListItem>
              <ListItem>Distribuir cualquier contenido que anime a la violencia o el incumplimiento de cualquier ley, derechos de propiedad o copyright.</ListItem>
              <ListItem>Distribuir cualquier contenido que contenga un virus o cualquier componente software dañino.</ListItem>
              <ListItem>Descompilar o intentar extraer el código base del software asociado al producto.</ListItem>
            </List>
            
            <SectionTitle>3. Acuerdo del nivel de servicio</SectionTitle>
            <Paragraph>
              El servicio depende de terceros para el acceso de los usuarios a este y para su correcto funcionamiento. Es por esto que MapYourWorld considerará algunos indicadores de servicios propios y otros externos, quedando extentos de responsabilidad por fallos de terceros, aunque se considerará la situación y se ofrecerán las compensaciones que se consideren necesarias y adecuadas, según lo establecido en el punto 3.2.
            </Paragraph>
            <Paragraph>
              Este acuerdo será revisado cuatrimestralmente para que los objetivos internos se mantengan realistas y alcanzables. De forma puntual, si algún tercero del que el servicio depende modificara en mayor o menor medida sus acuerdo de nivel de servicio, MapYourWorld modificaría de forma acorde los objetivos definidos a continuación.
            </Paragraph>

            <SectionTitle>3.1. Indicadores y objetivos del nivel de servicio</SectionTitle>
            <Paragraph>Los indicadores y objetivos del nivel de servicio son:</Paragraph>
            <List>
              <ListItem>Latencia: 95% de las llamadas con un tiempo de respuesta menor o igual a 0,3s (interno), 95% de las llamadas con un tiempo de respuesta menor o igual a 1s (terceros).</ListItem>
              <ListItem>Rendimiento: Soportar hasta 40 transacciones por segundo (interno), alrededor de 50 transacciones por segundo (terceros).</ListItem>
              <ListItem>Disponibilidad: Disponibilidad del 95%, considerando las dependencias a terceros (interno), alrededor de un 95% de disponibilidad (terceros).</ListItem>
              <ListItem>Índice de error: Índice interno menor de un 1% por el número total de llamadas, siendo el índice combinado menor de un 2% (interno), índices que no superen un 2% (terceros).</ListItem>
              <ListItem>Durabilidad: Durabilidad interna combinada del 95% (interno), una durabilidad del 99% (terceros).</ListItem>
              <ListItem>Exactitud de datos: Mantener un 98% de precisión combinada, un 99% interna (interno), mantener un 98% de exactitud (terceros).</ListItem>
              <ListItem>Exactitud de localización: Depende íntegramente de terceros. En versiones nativas, un margen de exactitud de 15m, mientras que en versiones web de hasta 500m debido a la naturaleza inexacta de la localización web.</ListItem>
            </List>

            <SectionTitle>3.2. Cláusulas de compensación</SectionTitle>
            <Paragraph>
              El equipo será responsable de mantener el servicio dentro de los objetivos establecidos y corregirá cualquier desviación que ocurra, dentro de lo posible. Debido a la alta dependencia en terceros, si estos notifican de cualquier impedimento que les impida adherirse a sus acuerdos de nivel de servicio, MapYourWorld se encargará de notificar a sus usuarios. Sin embargo, si ocurre algún imprevisto que imposibilite la calidad del servicio, MapYourWorld no se responsabilizará de estas pérdidas aunque sí considere las siguientes cláusulas de compensación para usuarios de planes base y premium.
            </Paragraph>
            <Paragraph>
              A los usuarios de plan básico, debido a que MapYourWorld no ofrece un bien básico y necesario y a la gratuidad del servicio, MapYourWorld no ofrecerá ningún tipo de compensación por falta de disponibilidad o gestión errónea de los datos.
            </Paragraph>
            <Paragraph>
              A los usuarios de plan premium, la incidencia se resolverá de forma diferente atendiendo al tipo de incidencia, ya sea falta de disponibilidad o incumplimiento de la política de privacidad, ofreciendo un descuento de hasta un 50% del siguiente pago del plan o hasta un reembolso, si se considera que el incumplimiento del acuerdo de confidencialidad ha sido de mayor calibre.
            </Paragraph>
            <Paragraph>
              Si el usuario considera que MapYourWorld ha podido ocasionar daños directos hacia su persona, este podrá ponerse en contacto con MapYourWorld a través del correo mapyourworld.group7@gmail.com exponiendo de buena fe dichos daños y una propuesta de compensación. MapYourWorld considerará la propuesta y se comprometerá a responder en un plazo de 30 días.
            </Paragraph>

            <SectionTitle>4. Cuentas de usuario</SectionTitle>
            <Paragraph>
              Existe la opción de usar MapYourWorld mediante una cuenta invitado que no necesitará de datos personales. Sin embargo esta opción estará muy limitada debido a la naturaleza del producto. Para poder disfrutar de todas las funcionalidades de la aplicación será necesario registrarse ofreciendo un correo electrónico válido.
            </Paragraph>

            <SectionTitle>5. Política de privacidad</SectionTitle>
            <Paragraph>
              Este punto tratará la información con la que trabaja MapYourWorld, cómo se usa esta información, si se comparte y cómo, cómo contactarnos sobre tu información y los derechos que todo usuario tendrá con respecto a su información.
            </Paragraph>

            <SectionTitle>5.1. Información recopilada y generada por la aplicación</SectionTitle>
            <Paragraph>MapYourWorld recogerá la siguiente información:</Paragraph>
            <List>
              <ListItem>Información de perfil: esto incluye correo electrónico, nombre y apellidos, nombre de usuario y una contraseña asociada a estos además del plan al que está sujeto el usuario.</ListItem>
              <ListItem>Información de ubicación: la ubicación a tiempo real no será recogida, lo que sí se recogerá de forma persistente serán los distritos descubiertos por el usuario.</ListItem>
              <ListItem>Información de puntos de interés: al crear un puntos de interés se guardará cualquier foto incluida, nombre y descripción proporcionada por el usuario.</ListItem>
              <ListItem>Información de logros: los logros desbloqueados por el usuario y cualquier logro personalizado que se haya creado.</ListItem>
              <ListItem>Información de amistades: los amigos del usuario y los mapas colaborativos a los que pertenece.</ListItem>
            </List>

            <SectionTitle>5.2. Uso de la información</SectionTitle>
            <Paragraph>
              La información geográfica recogida se utilizará única y exclusivamente para el módulo estadístico y de logros incluidos en el propio servicio. Toda información recogida o generada por MapYourWorld será de uso exclusivo por MapYourWorld y no serán compartidos ni accesibles por ninguna organización ni persona ajenas al equipo de MapYourWorld.
            </Paragraph>

            <SectionTitle>5.3. Seguridad de los datos</SectionTitle>
            <Paragraph>
              Implementamos medidas de seguridad técnicas y administrativas diseñadas para proteger la información personal de los usuarios para protegerla de accesos no autorizados o uso inadecuado. Sin embargo, toda medida de seguridad es imperfecta y penetrable, a pesar de nuestros mejores esfuerzos.
            </Paragraph>

            <SectionTitle>5.4. Datos de contacto y derechos de los usuarios</SectionTitle>
            <Paragraph>
              Al estar sujetos a la LOPDGDD, todo usuario tiene una serie de derechos con respecto a sus datos. Para cualquier contacto con el equipo, contáctanos mediante la dirección mapyourworld.group7@gmail.com y para comprobar todo los derechos de los usuarios, dirigirse al capítulo 2 de la LOPDGDD, un enlace a la misma puede encontrarse en el apartado 10.
            </Paragraph>

            <SectionTitle>6. Subscripción premium e información de pagos</SectionTitle>
            <Paragraph>
              El plan premium definido en la Política de precios será únicamente obtenible a través de las aplicaciones y productos oficiales de MapYourWorld y este no se hace responsable de cualquier fraude que pueda ocurrir por parte de terceros.
            </Paragraph>
            <Paragraph>
              Cuando se produzcan cambios en el servicio, si estos cambios son menores y no afectan a las funcionalidades ofrecidas para los usuarios premium estos no serán notificados. Sin embargo, si se realizan cambios significativos al servicio, todo usuario premium serán notificados con antelación, dándoles la oportunidad de no renovar la subscripción si este lo considera adecuado.
            </Paragraph>
            <Paragraph>
              El procesado de la subscripción se realizará a través de Stripe que tiene una política de privacidad y términos de uso propios.
            </Paragraph>
            <Paragraph>
              MapYourWorld no recogerá información sobre los métodos de pago sino sobre un historial de planes que podrá ser consultado por el usuario poniéndose en contacto con nuestro equipo a través del correo mapyourworld.group7@gmail.com.
            </Paragraph>

            <SectionTitle>7. Propiedad intelectual</SectionTitle>
            <Paragraph>
              Salvo que se indique lo contrario, todo contenido del servicio, incluido artículos, ilustraciones, capturas, gráficos, logos y otros archivos son propiedad de MapYourWorld y está protegido por las leyes de propiedad intelectual correspondientes. Si crees que algún fragmento del servicio infringe tu copyright y quieres notificarnos, hazlo a través del correo mapyourworld.group7@gmail.com con la siguiente información:
            </Paragraph>
            <List>
              <ListItem>Una descripción del producto con copyright o cualquier otra propiedad intelectual presuntamente infringida.</ListItem>
              <ListItem>Identificar el material que está presuntamente infringiendo dicho copyright, incluyendo una descripción de dónde está ubicado en toda versión del servicio.</ListItem>
              <ListItem>Un correo a través el cual podamos ponernos en contacto, si el usado para mandar la notificación no va a estar disponible.</ListItem>
              <ListItem>Si estás representando a una tercera parte, quiénes son.</ListItem>
              <ListItem>Una declaración firmada en la que se declare que la información anterior es correcta y la creencia en buena fe que el uso del material con copyright no ha sido autorizado por el propietario del copyright, su agente o la ley.</ListItem>
            </List>

            <SectionTitle>8. Terminación</SectionTitle>
            <Paragraph>
              MapYourWorld se reserva la posibilidad de suspender o terminar la cuenta de cualquier usuario si se considera que se ha violado cuualquiera de los términos de este acuerdo. En función de la situación de la que se trate, especialmente si el usuario no ha puesto en peligro a ningún usuario ni a sus datos, se le dará al usuario una oportunidad para corregir su falta antes de la suspensión o terminación.
            </Paragraph>
            <Paragraph>
              Todo usuario puede dejar de usar los servicios de MapYourWorld y terminar los términos de este acuerdo salvo aquellas cláusulas sin limitación, que incluye las cláusulas de Propiedad intelectual y Limitación de liabilidad.
            </Paragraph>

            <SectionTitle>9. Limitación a la liabilidad</SectionTitle>
            <Paragraph>
              Hasta donde lo permita la ley, los miembros del equipo de MapYourWorld no serán liables por ningún daño o perjuicio ya sea directo o indirecto, pérdida de beneficios, ingresos o datos que puedan producirse por el uso de MapYourWorld y este acuerdo de uso. Si un tribunal determinase que esta limitación no es legalmente válida, a la medida permitida por la ley, la máxima liabilidad a la que están sujetos los miembros del equipo de MapYourWorld por cualquier demanda que surja por el uso de nuestro servicio estará limitado a la cantidad pagada por el uso del servicio o los daños directos ocasionados por este.
            </Paragraph>

            <SectionTitle>9.1. Productos y servicios de terceros</SectionTitle>
            <Paragraph>
              El servicio puede contener vínculos a redes, servicios o plataformas que no están controladas por MapYourWorld. No nos hacemos responsables del contenido de un producto externo, inclusive el contenido de un distribuidor incluido con consentimiento de MapYourWorld. Tampoco nos hacemos responsables de mantener los materiales referenciados y la presencia en el servicio no implica que el producto esté disponible y sea fiel a lo mostrado.
            </Paragraph>

            <SectionTitle>10. Leyes gobernantes</SectionTitle>
            <Paragraph>
              MapYourWorld se encuentra bajo la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos y Garantía de los Derechos Digitales (LOPDGDD) que toma de referencia el Reglamento General de Protección de Datos (RGPD) publicado por la Unión Europea.
            </Paragraph>
            <Paragraph>
              Cualquier demanda será tramitada ante la Jurisdicción de lo Contencioso-Administrativo o de lo Civil, en función de las competencias de dicha demanda.
            </Paragraph>

            {/* Añadir un botón para facilitar el scroll al final */}
            {showBottomPrompt && scrollProgress < 90 && (
              <div style={{ height: 60 }}></div>
            )}

            {/* Espacio adicional al final para scroll */}
            <div style={{ height: 60 }}></div>
          </ContentWrapper>
        </ContentContainer>
        
        <ButtonContainer>
          {/* Indicador de progreso */}
          {showProgress && !canAccept && (
            <ProgressIndicator>
              <ProgressText>{scrollProgress}% leído</ProgressText>
              <ProgressBar>
                <ProgressFill style={{ width: `${scrollProgress}%` }} />
              </ProgressBar>
            </ProgressIndicator>
          )}
          <DeclineButton onClick={onClose}>
            Rechazar
          </DeclineButton>
          <AcceptButton 
            onClick={onAccept}
            disabled={!canAccept}
          >
            Aceptar
          </AcceptButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default TermsAndConditions; 