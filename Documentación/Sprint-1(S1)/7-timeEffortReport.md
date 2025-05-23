<p align="center">
  <img src="https://www.ucm.es/al-acmes/file/logo-universidad-sevilla/?ver" alt="Logo Universidad Sevilla" width="200" height="200">
  <img src="https://i.imgur.com/vlzkG4H.png" alt="Imagen Imgur" width="auto" height="200">
</p>

<h1 align="center">Reporte de horas</h1>

<p align="center">
    Grupo 7
</p>
<p align="center">
    ISPP-MapYourWorld
</p>
<p align="center">
    Sprint 1
</p>
<p align="center">
    Alfonso Luis Alonso Lanzarán
</p>
<p align="center">
    13/03/2025
</p>

**CONTROL DE VERSIONES**

| VERSIÓN | FECHA     | COMENTARIOS              | AUTOR              |
|---------|-----------|--------------------------|--------------------|
| V1      | 13/03/2025| Primera versión          | Alfonso Luis Alonso Lanzarán |
| V1.1      | 13/03/2025| Añadir justificación disparidad de horas         | Alfonso Luis Alonso Lanzarán |

<!-- omit in toc-->
# Índice
- [Índice](#índice)
  - [1. Resumen ejecutivo](#1-resumen-ejecutivo)
  - [2. Explicación de las horas excesivas o escasas de los miembros](#2-explicación-de-las-horas-excesivas-o-escasas-de-los-miembros)
  - [3. Gráficas del tiempo invertido](#3-gráficas-del-tiempo-invertido)
    - [3.1. Gráfico de barras](#31-gráfico-de-barras)
    - [3.2. Gráfico de sectores](#32-gráfico-de-sectores)
  - [4. Datos originales exportados de clockify](#4-datos-originales-exportados-de-clockify)


## 1. Resumen ejecutivo

En este documento se muestra la cantidad de horas invertidas en el proyecto por cada miembro del equipo, en el siguiente punto se comentan los desvíos de las horas planificadas para este sprint (30 horas)

NOTA: El "pantallazo" de las horas ha sido tomado el día 13/03 a aproximadamente las 18:30

## 2. Explicación de las horas excesivas o escasas de los miembros
Gonzalo García Lama:
Como se puede observar en las gráficas de lo puntos 3.1 y 3.2, hay un miembro del equipo, Gonzalo García Lama, que ha trabajado una cantidad de horas completamente desmedida durante este Sprint. 
Esto se debe a que Gonzalo es la persona con más conocimientos técnicos sobre el proyecto y las tecnologías que estamos usando, eso se ha traducido en que no solo ha inicializado la totalidad del proyecto sino que ha creado la api gateway y los webhooks. 
Lo anteriormente mencionado es aproximadamente la mitad del tiempo trabajado por Gonzalo incluyendo documentación para evitar la dependencia que el equipo tiene de él y fomentar la autonomía a la hora de desarrollar del equipo.

Lamentablemente los miembros del equipo no hemos implementado correctamente las cosas más básicas(entidades, controladores, servicios, etc.) y debieron de invertirse una enorme cantidad de horas en corregir el trabajo de otros compañeros.

Para paliar este exceso de horas y dado que el backend está implementado casi en su totalidad, a partir del Sprint 2 Gonzalo tendrá un rol más pasivo en el que se utilizarán sus horas para las tareas muy exigentes a nivel técnico, api-gateway, webhooks, configurar rabbitMQ. También se usarán para resolver errores puntuales que los miembros no puedan indidualmente.

Aberto Escobar Sanchez:
A este miembro del equipo se le asignó inicialmente una cantidad normal de tareas y se estimaba que iba a trabajar 30 horas durante el sprint aproximadamente, hizo sus tareas extremadamente rápido(crear una entidad y un conjunto servicio-controlador-ruta) con una calidad extremadamente baja lo que implicó invertir 10 horas de Manuel Velez y 10 horas de Pedro Pablo Santos en correcciones del servicio Auth, las entidades y las relaciones.

Se ha planeado corregir está diferencia respecto al tiempo estimado en el Sprint 2, también se han tomado medidas para mejorar la calidad de las tareas siendo la más potente crear una suite de test y obligar mediante el commitment agreement al equipo a crear test unitarios.
## 3. Gráficas del tiempo invertido

### 3.1. Gráfico de barras

![Gráfico de barras con las horas trabajadas](Images/diagramaBarrasHoras.png)

### 3.2. Gráfico de sectores
![Gráfico de sectores con lsa horas trabajadas](Images/diagramaSectoresHoras.png)

## 4. Datos originales exportados de clockify
|User|	Description|	Time (h)|
|---|---|---|
|Gongarlam|		|86:48:07|
|   |Preparación de estructura de proyectos en GitHub|	|01:34:49|
|   |Correción de bugs RabbitMQ con las colas	|01:16:03|
|   |Haciendo: Mapas colaborativos	|03:28:57|
|   |Realizar frontend para que calcule y renderice los polígonos de la base de datos	|02:14:28|
|   |Realizar codigo en infraestructura para despliegues continuos (base)	|01:23:46|
|   |Haciendo: Sincronización en Tiempo Real de Cambios en el Mapa colaborativo	|01:43:32|
|   |Arreglar frontend y conectarlo para que sea visible en modo desarrollo	|01:10:47|
|   |Probar dependencias y hacer correciones	|03:28:27|
|   |Presentaciones de Proyectos y asisencia a Clase	|04:00:00|
|   |Reunión grupal Domingo	|01:20:02|
|   |Integrar RabbitMQ en Api-GetAway y conectar microservicios	|06:01:08|
|   |Modificando comandos para el grupo y facilidad de uso en node_modules y gestión de paquetes de dependencias	|00:43:28|
|   |Rediseñando mapa conceptual y tipos	|01:38:37|
|   |Realizar codigo backend y frontend (tipos y bases)	|05:35:07|
|   |Inicializar frontend e instalar dependencias para desarrollo móvil	|02:04:34|
|   |Reunión Grupal para avances del equipo y dudas (Review)	|01:57:50|
|   |Arreglo de dependencias y fallos en todo el codigo	|07:43:39|
|   |Arreglo de fallos de dependencias e inicio de npm/node	|01:13:07|
|   |Clase del día Viernes	|03:30:00|
|   |Haciendo: Adaptar componentes de la interfaz móvil a la web	|04:33:34|
|   |Optimizando api-getaway, añadiendo funcionalidades, QoS, TLS/SSL, incorporando DLQ, Backoff exponential, prefetch de cada microservicio en numero de mensajes	|03:15:37|
|   |Documentar funciones con IA para facilitar la comprensión dentro del propio codigo	|01:26:51|
|   |Realizar documento de backend (explicaciones exhaustivas de tecnologías y técnicas, también comparaciones)	|10:42:23|
|   |Implementar modulo central de microservicios (API-GetAway)	|02:09:54|
|   |Correción front de modulos	|00:12:56|
|   |Ayudar en explicar el backend y work flows del codigo	|01:51:48|
|   |Establecer codigos con //TODO para facilitar las tareas al equipo	|01:45:09|
|   |Arreglando archivos de configuración para instalaciones	|02:16:49|
|   |Investigación y realización del documento TÉCNICO INTEGRAL: ARQUITECTURA, FLUJO DE USUARIO Y  MODELO DE NEGOCIO	|04:14:17|
|   |Mejorar readme Api-GeyAway	|00:33:16|
|   |Realizar diagramas de paquetes y dependencias de módulos para el codigo	|01:37:12|
|Pedro Pablo Santos Domínguez		|49:46:12|
|   |clase ispp	|04:00:00|
|   |Creacion de las relaciones #114	|12:29:41|
|   |Asignacion de tareas en github	|03:49:59|
|   |Reunion de retrospectiva	|02:22:38|
|   |arreglos de inicio de base de datos de map-service	|01:18:56|
|   |Hacer documento Planificación del sprint 2.md	|01:00:01|
|   |Clase de ispp 07/03	|04:00:00|
|   |Creacion de tareas para la segunda mitad del sprint	|00:07:26|
|   |Diseño del modelo conceptual	|02:30:00|
|   |reunion 09/03	|01:14:45|
|   |Token de usuario #127	|01:22:36|
|   |Entidad mapa #93	|01:39:29|
|   |distritos #30	|08:00:00|
|   |Unir las rutas para el api-gateway #95	|02:58:30|
|   |Creacion de usuarios de prueba #134	|00:29:42|
|   |Reunion semanal	|00:45:00|
|   |modelado conceptual	|01:37:29|
|Manvellop2		|48:49:26|
|   |Actualizar documento 7-Politicas para el desarrollo.md	|00:19:47|
|   |Distritos #30	|08:48:56|
|   |Diseño del modelo conceptual	|04:01:09|
|   |Creacion de las relaciones #114	|09:11:08|
|   |Modulo social #37	|01:54:50|
|   |Creación de amonestaciones	|00:12:29|
|   |Reunión semanal 02/03/25	|01:52:08|
|   |Creación de usuarios de prueba #134	|00:30:00|
|   |Clase 4 ISPP	|04:00:00|
|   |Reunión semanal 09/03/25	|01:08:03|
|   |Unir las rutas para el api-gateway #95	|10:14:01|
|   |login y registro #97	|02:50:03|
|   |Creacion de la base de datos #64	|02:23:52|
|   |Retrospectiva	|01:23:00|
|Angel Neria		|45:14:18|
|   |Realizar documento 7-Planificación del Sprint 2	|00:05:16|
|   |Reunion semanal día 09/03	|01:00:00|
|   |Inicialización del frontend y arreglo de conflictos	|03:06:57|
|   |Clase día 07/03	|04:00:00|
|   |Creación de pantalla del mapa	|01:00:12|
|   |Visualización de zonas en el mapa principal	|06:33:50|
|   |Corrección de estilos de pantallas y navegación entre ellas	|02:47:01|
|   |Realización documento de Retrospectiva mitad de Sprint 1	|02:34:26|
|   |Arreglo de configuración frontend	|03:37:00|
|   |Clase dia 21/02	|04:00:00|
|   |Función para descubrir las zonas y enviarlas al backend (Frontend)	|03:15:14|
|   |Realización de la quinta presentación	|00:36:59|
|   |Realizar documento revision.md	|01:34:42|
|   |Reunión día 22/02	|01:00:00|
|   |Reunión día 2 de marzo	|01:00:00|
|   |Creación del modelo conceptual	|01:31:54|
|   |Mostrar puntos de interés (Frontend)	|04:08:50|
|   |Registrar puntos de interés (Frontend)	|03:21:57|
|Alba Ramos		|40:45:18|
|   |Retrospective mitad de sprint 1, presentación	|00:24:01|
|   |Mock test para comprobar la funcionalidad del controlador	|02:00:00|
|   |Retrospective mitad de sprint 1	|01:46:00|
|   |Reunión semanal	|03:12:00|
|   |Crear Pantalla de Mapa Colaborativo #23	|02:21:02|
|   |Clase del 21/02	|03:50:00|
|   |Sincronización en Tiempo Real de Cambios en el Mapa colaborativo #24	|04:58:58|
|   |Clase del 07/03	|03:50:00|
|   |Obtener ubicación a tiempo real	|04:12:42|
|   |Adaptar componentes de la interfaz móvil a la web #96	|12:40:35|
|   |Inicializacion del proyecto	|01:30:00|
|Franco Dell Aguila		|38:28:20|
|   |Investigar plataforma de despliegue	|01:06:00|
|   |Revisión Idea_de_negocio.md	|01:52:02|
|   |Clase 7/3	|03:50:00|
|   |Reunion 2/3	|01:53:45|
|   |Reunión 9/3	|01:15:00|
|   |Convertir documentos a Markdown	|01:55:07|
|   |Revisión retrospectiva_mitad_sprint_1.md	|00:42:38|
|   |Presentación	|02:27:05|
|   |Obtener ubicación en tiempo real	|07:44:16|
|   |Despliegue APK	|01:33:07|
|   |Ver resumen reunion 23/2	|00:19:00|
|   |Obtener ubicación en tiempo real - merge	|00:32:47|
|   |Revisar Retrospectiva	|00:32:15|
|   |Clase 21/2	|03:50:00|
|   |Ayuda en discurso presentación	|00:58:15|
|   |Despliegue	|07:57:03|
|antporara		|35:23:33|
|   |Backend auth service: Crear tabla de usuario y hacer fixes	|00:51:56|
|   |Sprint retrospective y tareas de coordinación	|01:11:00|
|   |Planificación semanal	|01:21:00|
|   |Instalar stack tecnológico	|01:01:20|
|   |Preparar presentación	|03:54:29|
|   |Backend email service	|01:03:20|
|   |Login y registro #97	|05:23:59|
|   |Backend auth service: email controller	|00:45:40|
|   |Comunicación con Fisiofind como usuario piloto	|00:15:00|
|   |Actualizar dependencias y resolver conflictos	|00:20:34|
|   |Reunión 23/02: planificación semanal	|00:35:50|
|   |Backend auth service: login y registro	|00:48:06|
|   |Implementación user service: generalizarlo para hacerlo accesible de manera más sencilla desde los demás modulos	|00:51:58|
|   |Configurar BBDD	|00:09:20|
|   |Preparar la presentación	|00:41:53|
|   |Redactar documentación: Métricas de calidad del equipo	|00:44:55|
|   |Backend auth service: crear roles de usuario en el modelo, gestión con middleware para las validaciones, gestión de admin (service, controller, routes) y rutas de auth	|02:28:00|
|   |Hacer pruebas de funcionamiento con consultas de los servicios realizados de map y auth	|01:36:27|
|   |Subdividir tareas testing Sprint 1	|00:58:48|
|   |Clase día 7/03	|04:00:00|
|   |Tareas de coordinación y preparar la presentación	|01:01:00|
|   |hacer: Planificación Sprint 2 equipo Testing	|01:00:55|
|   |Presentación de la semana 5	|00:20:00|
|   |Creación de relaciones #114	|01:40:00|
|   |Token de usuario #127	|02:18:03|
|Jaime Gomez Marin		|33:51:53|
|   |reunion	|01:12:46|
|   |instalación nuevas dependencias y encontrar problema en BD	|02:02:14|
|   |Cambiar portadas de documentos	|00:41:40|
|   |clase de la cuarta semana	|04:00:00v
|   |Registrar puntos de interés	|02:51:05|
|   |mostrar puntos de interés	|01:19:18|
|   |reunión	|01:45:00|
|   |Crear revision.md	|01:50:32|
|   |Actualizar Análisis de competidores en ideadenegocio.md	|01:01:05|
|   |Convertir documentos a Markdown	|01:42:27|
|   |clase	|04:00:00|
|   |Frontend cambiar pantallas login y registro	|01:16:18|
|   |Cuarta presentación	|02:11:58|
|   |Obtener las zonas del backend y mostrarlas en el mapa	|05:01:47|
|   |Subir documentacos markdown	|01:52:54|
|   |Función para descubrir las zonas y enviarlas al backend	|01:02:49|
|José María Baquero		|33:24:24|
|   |Actualizar revision.md	|02:37:39|
|   |Reunion planificación semana 6	|01:11:49|
|   |Registrar puntos de interes	|04:04:46|
|   |Realización presentación semana 5	|03:24:59|
|   |Reunion planificación semana 5	|01:43:33|
|   |Reunion planificación semana 4	|00:31:34|
|   |Entorno front y documento de ayuda	|00:42:00|
|   |Convertir documentos a Markdown	|00:22:06|
|   |Función para descubrir las zonas y enviarlas al backend	|03:18:33|
|   |Clases 21/02	|04:00:00|
|   |Clases dia 07/03	|04:00:00|
|   |Subir documentos markdown	|00:21:00|
|   |Modelo conceptual	|01:16:53|
|   |instalacion nuevas dependencias y problemas con la BD	|02:04:00|
|   |Obtener zona backend y mostrar en el mapa	|01:55:41|
|   |presentacion semana 5	|01:49:51|
|Alfonso Luis Alonso Lanzarán		|32:55:30|
|   |Preparación de la reunión técnica del 2/03	|03:00:00|
|   |Clase 07/03	|04:00:00|
|   |Tarea: Entidad puntos de interes #81	|03:20:00|
|   |Cálculo de las métricas de rendimiento	|02:49:16|
|   |Revisar documentos: cambiar nombres documentos	|00:04:00|
|   |Preparación presentación semana 5	|04:04:09|
|   |Tareas de coordinación	|01:37:14|
|   |Reunión semanal 09/03	|01:12:00|
|   |Reunión técnica 2/03	|02:00:00|
|   |Revisión del código, solución de conflictos de merge	|04:20:00|
|   |Hacer publicación sobre como imputar tiempo a las tareas	|00:13:44|
|   |Crear documento: retrospectiva del Sprint 1	|01:20:32|
|   |Mosificar documento:performanceEvaluation.md	|00:24:24|
|   |Crear la diapositiva Problemas encontrados	|00:33:41|
|   |Crear documento: KBreport.md	|01:06:41|
|   |Crear documento: Análisis del rendimiento del equipo	|02:03:14|
|   |Reunión semanal 23/02	|00:40:00|
|   |Revisar documento: pilotUsers.md	|00:06:35|
|Pabcabmar3		|32:20:00|
|   |Hacer controller, service y model de POI nuevo	|02:00:00|
|   |Reunión semanal	|01:15:00|
|   |Actualizar documento revision	|00:20:00|
|   |hacer Análisis y comparación CI-CD.md	|01:30:00|
|   |Ver vídeos teoría	|01:00:00|
|   |Probar alternativas despliegue	|02:00:00|
|   |Despliegue Azure	|03:00:00|
|   |Workflow sonarcloud	|01:00:00|
|   |Hacer service y tests de JWT, y archivos config	|04:00:00|
|   |Prehook para conventional commit	|00:45:00|
|   |Workflow monitorizar días por issue	|03:00:00|
|   |Modificar performance evaluation	|00:30:00|
|   |Clase 21/02	|04:00:00|
|   |Hacer controller, service y tests de POI	|04:00:00|
|   |Clase 08/03	|04:00:00|
|Pablo Olivencia Moreno		|31:10:05|
|   |Revisión UserProfile #94	|03:10:00|
|   |Implementación User Service	|09:15:40|
|   |Píldoras Teóricas	|01:49:26|
|   |Reunión 23/02	|00:30:25|
|   |Clase 21/02	|04:00:00|
|   |Reunión 2/3	|00:59:23|
|   |Reunion 9/3	|01:12:30|
|   |Adaptar componentes de la interfaz móvil a la web #96	|05:38:37|
|   |Entidad de userProfile #94	|00:44:04|
|   |Clase 7/3	|03:50:00|
|Clagonben		|31:02:19|
|   |aportando a la bdd	|01:17:34|
|   |Modulo social #37	|02:14:07|
|   |actualizar documento 7-pilotUsersCommitmentAgreement.md	|00:19:45|
|   |buscando porque no arranca la app	|00:28:58|
|   |Crear documento pilotUsersPerformanceEvaluation.md	|00:28:20|
|   |Gestion usuarios piloto	|01:11:27|
|   |reunion	|01:12:00|
|   |mas gestion de usuarios piloto, reunirme y actulizar las diapos	|02:08:34|
|   |peleandome con imports (hoy ganaron)	|01:04:23|
|   |actualizar documento 7-Pilot-Users	|00:14:48|
|   |hacer documento 7-pilotUsersCommitmentAgreement.md	|00:55:24|
|   |configurando framework	|00:47:36|
|   |Realización presentación semana 5	|01:06:14|
|   |implementando email.routes	|00:09:02|
|   |clase	|03:50:00|
|   |enviando primer correo	|00:14:00|
|   |Arreglo de la asignacion de a ip #128	|02:03:23|
|   |reunion domingos	|00:45:00|
|   |clase de evalucacion 1	|03:40:00|
|   |configuracion de entorno	|00:57:23|
|   |reunion todo en llamas	|01:43:00|
|   |Creacion y envio del primer formulario	|01:06:34|
|   |Gestion de usuarios piloto, volver a mirar encuestas y automatizacion de estadisticas y ponerlas en la presentacion	|02:11:24|
|   |Actualizar la base común del conocimiento	|00:53:23|
|Alejandro Aragón Sánchez		|30:03:26|
|   |Reunión semanal 02/02/25	|01:59:00|
|   |Revisar plan de riesgos semana 5	|01:25:48|
|   |Clase semana 4	|04:00:00|
|   |Reunion 09-03	|01:28:00|
|   |Creacion de la entidad user #80	|02:25:34|
|   |Asignacion de tareas en github	|01:08:21|
|   |Planificación tareas seguridad	|02:49:32|
|   |Seguridad en repositorio Github	|02:15:18|
|   |Profile.service #34	|01:33:12|
|   |Clase 07-03	|04:00:00|
|   |Entidad region #113	|03:35:10|
|   |Configuración entorno desarrollo	|02:10:14|
|   |Configurar una Security Policy (SECURITY.md) #106	|01:13:17|
|Ricardo Carreño Mariño		|23:16:18|
|   |Presentacion semana 3	|04:00:00|
|   |Clase Viernes 07/03	|02:00:00|
|   |Subir documentos markdown	|01:19:32|
|   |Realización presentación Semana 5	|00:20:09|
|   |Arreglar presentación	|05:42:37|
|   |Convertir documentos a Markdown	|04:40:16|
|   |Asignación de tareas + Realización presentación Semana 5	|04:00:55|
|   |Planificación semanal	|01:12:49|
|Alberto Escobar Sánchez		|18:25:11|
|   |creacion entidad y repositorio de region	|01:46:56|
|   |reunion 02/03	|01:57:32|
|   |presentacion	|01:44:56|
|   |clase 07/03	|04:00:00|
|   |auth service	|01:42:49|
|   |creacion entidad user	|00:44:55|
|   |instalacion app	|00:51:59|
|   |clase 21/02	|04:00:00|
|   |Reunión 23/02	|00:08:41|
|   |reunion 09/03	|01:27:23|
|Total (21/02/2025 - 14/03/2025)||		611:44:20|
