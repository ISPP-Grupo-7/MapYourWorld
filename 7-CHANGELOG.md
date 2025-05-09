<p align="center">
  <img src="https://www.ucm.es/al-acmes/file/logo-universidad-sevilla/?ver" alt="Logo Universidad Sevilla" width="200" height="200">
  <img src="https://i.imgur.com/vlzkG4H.png" alt="Imagen Imgur" width="auto" height="200">
</p>

<h1 align="center">Changelog</h1>

<p align="center">
    Grupo 7
</p>
<p align="center">
    ISPP-MapYourWorld
</p>
<p align="center">
    Sprint 3
</p>
<p align="center">
    Claudio González Benito
</p>
<p align="center">
    10/04/2025
</p>

<h2>CONTROL DE VERSIONES</h2>

<table>
  <tr>
    <th>VERSIÓN</th>
    <th>FECHA</th>
    <th>COMENTARIOS</th>
    <th>AUTOR</th>
  </tr>
  <tr>
    <td>V1</td>
    <td>10/04/2025</td>
    <td>Primera versión</td>
    <td>Claudio Gonzalez Benito</td>
  </tr>
</table>

# Índice
- [Índice](#índice)
  - [docs](#docs)
  - [feat](#feat)
  - [fix](#fix)
  - [refactor](#refactor)
  - [style](#style)
  - [test](#test)


---

## docs

Los commits en la categoría **docs** ordenados por fecha:

- **2025-03-31:**  
  * 7-revision.md para tercer sprint [a85c0fcdb852c537a55d7c91dbf8f829f7c4ccec]

- **2025-04-09:**  
  * actualizado 7-revision.md con las nuevas funcionalidades y cambios implementados [7d5be1721fce0ab652ed8ac950d56b6cdbfad69f]

- **2025-04-10:**  
  * actualizadoAI-Usage.md [47c472b0b29f3b12a6f8fc17578edb6f74f40718]  
  * añadir la planificación del Sprint 4 con objetivos y responsabilidades del equipo [d796751ac9fe7e6042f262f5b28eeda7c9a1d3cc]  
  * commitmentAgreement añadido al Sprint 3 [aea65e1ee0798ab5e677ddd55ea3871d2324882e]  
  * Corrección de documento de planificación [b3c3afc5731efb25fa849f0372680442613904df]  
  * Corrección de errores en documento de planificación [fa7e167537a578a266be66c2700c0bf30b6ec824]  
  * Corrección enlace a la demo de video demostración [0eaf02fb5ea185799e1179f6696f37d13e000f7a]  
  * documentacion de usuarios piloto [01d6dcafe8b60a2c680fb229c666478355968ced]  
  * Se ha actualizado el enlace a la demo de este sprint [c444e92a6f4efa37810605c57856949735274859]  
  * Se ha revisado el informe de revisión, a falta de introducir el enlace a la demo actualizada [ed24f6d6ed07e8208e40b31667798bb520b74baf]

---

## feat

Los commits en **feat** ordenados por fecha:

- **2025-04-01:**  
  * add web support for CollaborativeMapListScreen in App.tsx [0e5a36df6fe82e170e76564752075e7ce221c11b]  
  * Añadido de la función de inivitar a amigos desde la lista de mapas colaborativos [3b80a28533d6de45df282b4ed9ef6bb230453548]  
  * añadido de los errores de input validation y comprobaciones [75addc0b75b4051de17d30b30da9ced3802996ba]  
  * Implementar mejoras version web [e8d98b7c849e8fdef2b77cdcdd9520c075721f17]  
  * mejorar la lista de los mapas colaborativos [64124dcdb47235a85bbadbfa59b8cb8aea276e8d]  
  * Se ha implementado la lógica que permite a un usuario con plan FREE crear un único punto de interés por distrito desbloqueado, en caso de tener suscripción PREMIUM se pueden crear tantos como se desee [734ad380a4a7311c85f86970fd985fc807fbb253]

- **2025-04-02:**  
  * Añadido de la funcionalidad de crear POIs en mapas colaborativos [add5ec2eef9021066129ad693259a5757d757c35]  
  * Implementar mejoras version web [486ad3f8aaf3484e854901ed2a0fe9e3d26c6b9b]  
  * Mejorar pantalla de estadísticas web [58acf434b4534da9f3430229418a279ceed5a928]  
  * Mejorar pantalla de logros movil [08f64101d2845383f1bcfd755ceeb4fc45bf4e4c]  
  * Mejorar pantalla de logros movil [a97262b9634981f49d652009fa954de0b3b9a363]  
  * servidor local de sonarqube (para tener funcionalidades premium de sonarcloud) + CI workflow [d8de61d9fe041aafa56bf3b5bf6ae19e935e42cb]  
  * Crear funcionalidad de estadísticas y refactorización [7898ec6808fe1935654afef19b2498f487fba6de]  
  * Crear funcionalidad de estadísticas y refactorización [d2c0b0fa9cdb69d9a22e22b0f7ddc0be13c55372]

- **2025-04-05:**  
  * Implementar cambios web y movil [ee50758c22cdbb55fa67c39cc31d26078c1b692b]

- **2025-04-07:**  
  * Implementa el componente AnimatedPremiumButton e integra la obtención de la suscripción en AppContent. [dbf5a9ae774547ee7e284cf49ee85a0381a44682]  
  * Mejorar pantalla de suscripcion [375b4b8b48c22f13486416a667d944fff2057972]  
  * Se ha añadido el nombre de usuario del usuario actual en el HamburguerMenu [5a90def362252f7f2605a2b737025852836cf512]  
  * Se han modificado las pantallas de social para mostrar más información sobre amigos, según han solicitado los usuarios piloto [b2c208f2a90c19c24fb3c9bde049a52a2d66e916]

- **2025-04-08:**  
  * Se ha organizado el hamburger menú para visualizar de forma más clara el botón de "Cerrar sesión" [6920b61bbda883671400cad5b31a280ce20029ea]

- **2025-04-09:**  
  * add POI creation and retrieval endpoints with validation and integration tests [2b0f7c5a14168fd44948583f1ab5d66034145883]  
  * Añadido parte de anuncios al registro, 10 segundos obligatorios para usaurios que se acaban de registrar [f73ae2f39edd6561c7643f55f1c3c6f8468271d0]

---

## fix

Los commits en **fix** ordenados por fecha:

- **2025-03-31:**  
  * Añadir comprobaciones al servicio y arreglar los fallos que daban los tests al incluir el código [616f3f2c960dbf61f623a5625b5a006554676f92]  
  * Arreglar test unitarios de friend tras traer la rama develop [916b987b9189f1ac3ff8164d1a8c750bdd15000c]

- **2025-04-01:**  
  * Arreglo de pantallas de creación de pois, web y móvil, con input validation [2cfea6b67d8fde1baa6a7e01ce6b64ebd1132d62]  
  * corrección de mal etiquetado de campos [b7a6c8d10b09f8f05f7022779b539d4c3d9b74a4]  
  * Corrección de pantalla de registro [f659bf7e8f2360a1f18779007572f48469502f18]  
  * Eliminar clases no utilizadas y refactorizar asincronias en servicio de foto #269 [ee5134db0388980bd0d5a401b34060c75802f4d1]  
  * Refactorización de payment-service realizada, modificando subscription, eliminando payment el cual no se usa y tests de suscription solucionados [3edc0e595af6500c465ba285d7a767cad417f65c]  
  * visionado de todos los mapas colaborativos [6055119808024fa4bfe281d16ec0dbd9fc262d35]

- **2025-04-02:**  
  * ahora deja eliminar un mapa cuando tiene invitaciones asociadas eliminandolas tambien [01c0eecb0636142c4b18a92f148a89f4cc9f318f]  
  * añadir userStatRouter a backend_endpoint y modificar userId en routes [d21f169250f51e12da67545126b0280052ead431]  
  * Arreglar tests de auth para que vuelvan a pasar todos con la refactorización [to_review #274] [d1a027db68a477f7a4429bdac3d9b9fb27be0f47]  
  * Arreglar tests de auth para que vuelvan a pasar todos con la refactorización [to_review #274] [b045de5d401b6a60e706e6cceb25ea69d3b31668]  
  * asegurar la logiac de eliminacion apra que todos los usuarios puedan eliminar el mapa colaborativo de su lista de mapas [d59ef69b67e4bfdcef3dcf916c394a6d4e178033]  
  * cambios en la eliminación de mapas colaborativos. ahora solo se elimina el mapa cuando lo abandona el ultimo usuario [3570099ed47dd2b107232e116120b6522ffbe285]  
  * correcion al elimianar los pois de un mapa que va a ser eliminado. [02441fc29629b9528486b3775cbcf729030add32]  
  * corregir la asignación de nombres de usuario para usuarios en mapas colaborativos [0b9101c77e1eedd513913234ba98e11bbbd19370]  
  * Eliminar archivo de pruenas de integración de friend, hay que rehacerlo #269 [50274fcc2d7f465fe343d2b69e2d62961471ba18]  
  * Eliminar funciones y clases no empleadas #274 [afc46bc9ce6ebdac1bf68f5c02fa7e74ec7597b1]  
  * Eliminar funciones y clases no empleadas #274 [3342cef58127effba6e4a935e250337ffdcafd74]  
  * implement cascading delete for maps and districts, update deleteMap logic to handle user removal [255c28337d68bf1ba37dd1c03ed6cdc22f1bf5d3]

- **2025-04-03:**  
  * actualizar el color de fondo del botón de invitación en mapas colaborativos [a001826d10fb186ea90790681a6ff6369b9a1141]  
  * actualizar el color de fondo del botón de invitación en mapas colaborativos para móvil y web [63a8c715d175418ed6d8d6ecf82a6275f3267d75]  
  * ajustar el espaciado y tamaño del texto en los botones de invitación y cierre en lista de mapas colaborativos [0f4455a3acd0d22e1191bc6683a78ce36dfd9128]  
  * añadir verificación de suscripción premium para crear mapas colaborativos [e8f4d11d0d61955a8a0c41319d79d228bf9f910a]  
  * Arreglar tests de subscription [1aa8aa1721f92f801d304208164c41c22b043b5d]  
  * Corregido los tests de integracion de photo [76932af5c5a6439c8c0cf15a9ab8001f5e8e7796]  
  * ejecutar todos los tests a la vez [8fe8ee3bbdf442631c6ac4b557e81a3e740e3594]  
  * excluir models, controllers y routes [7708f865700fe44b0b709851e514cecfbdfdb164]  
  * mover dependencias de los package.json al script de actualizar dependencias + primer try para que sonar tenga coverage [f1c31964bcef3672834f9c3ba2ed443e36c690cd]  
  * se borraron estas imagenes [aeb54c03ae447948d87771714103963cb5b8cf11]  
  * mejorar la lógica de invitación de amigos en mapas colaborativos [0d82f3f1b1c9650094334d30247f73c329b720ee]  
  * mejorar la lógica de invitación de amigos en mapas colaborativos añadiendo verificación de amigos disponibles [621d38f279446017c553927bfbbf0b34943727a3]  
  * mejorar la lógica de invitación de amigos en mapas colaborativos para movil [bd7143055decfc4f55820ea8e98a7169afdd67fb]  
  * mejorar mensajes de alerta al enviar invitaciones en mapas colaborativos [c6c2ce8cebe586b0459c1bc6bc6327db43dc9552]  
  * mejorar mensajes de alerta al enviar invitaciones en mapas colaborativos [91be9378bd7d152004b091c48b92de26094d1e0e]  
  * delete unused code [71f702a32228b1bcbae69f63170381f90fa7459e]  
  * Se han realizado ajustes en los tests y se ha eliminado una clase que no se usaba para nada [5501dbdee1156d42dbb9a43d847eadcdf4de0b35]

- **2025-04-04:**  
  * implementar restricciones de suscripciones al unirse a mapas colaborativo desde la pantalla de social [f6f9b07e4262dfaab20a43fe476e03d4c2755d0a]  
  * actualizacion de la busqueda de usuarios para usar coincidencia parcial y mejora del formato de los mensajes de alerta [2403eea783499fdb31afb010b8c9c6089af3b5a6]  
  * actualizado frind repository par mostrar username en la parte de social [a3d3f326f1c2e3781a8142135fcfa38b3a8c0824]  
  * agregar lógica para manejar suscripciones y mapas colaborativos en la pantalla social [071e423145f8eb9627d8d95374dcd1069558b6f9]  
  * agregar modal de alerta para mostrar mensajes de error en la pantalla del mapa colaborativo [559161b146e3bf38641eebed6089b2c9374bd2a1]  
  * coverage arreglado [b80816e6cca5f962cf044732f8d7501e0b77f981]  
  * intento de arreglar coverage [695dffe89434919cce7c130e427b38db87e1d781]  
  * intento de arreglar coverage [83528ad188a5b6a75933a2a53a8874d9589b0ec5]  
  * intento de arreglar coverage [9e57473975f61889f4c4b6505f7967bff98bd932]  
  * intento de arreglar coverage [40356c440b554afb935a0092f7a75ee85213cb87]  
  * intento de arreglar coverage [79f1ae07da21f6a3545ab7aa17be7b18dab5a506]  
  * intento de arreglar coverage [c4557977460846658aa26e02a5f5fb5b524d80b5]  
  * mejorar la lógica de manejo de errores en la pantalla del mapa colaborativo [004d8411114d501e29c8acd5b374fa29c02faff9]  
  * modificar la visualización de amigos para mostrar nombres de usuario en lugar de correos electrónicos y mejorar los mensajes de alerta. [c5559239763e7ab5b9ab8168648ab0b0067c6478]

- **2025-04-07:**  
  * Actualiza el método getDistrictsUnlocked para filtrar por userId [3eca22a11a942dc6eef98b6cb8c5e023171f13de]  
  * Arreglar test de integracion friend [26546cebb41c04693d09211c432287b7db738510]  
  * Se ha modificado la recarga de pantallas a petición de usuarios piloto para que no se reenvie a la pantalla de welcome tras recargar en web [44a0568ae7d433a42a914d054f1a504d9766cb65]

- **2025-04-08:**  
  * arreglos de los tests tras un mergeo a la rama develop. [22f108a07f70b29ca6e3a18c626e51d2c243b183]  
  * Se han cambiado los iconos de puntos de interés y se ha modificado el desplegable para elegir el tipo de punto de interés para hacerlo más visual, según la recomendación de usuarios piloto. [c6279bf76dd8d58441b3c9c2df1b7b69efd73be4]  
  * Se han corregido los iconos de puntos de interés en mapas colaborativos de web, También se ha corregido la posición del formulario de punto de interés en móvil. [64b2507994b5a7849dceff55688ce4f1a74840e3]

- **2025-04-09:**  
  * Se ha arreglado el manejo del estado de suscripción tras realizar el pago de una suscripción premium [d573d595f4811a125de5f21538133b7c92bb1e6c]  
  * Se ha corregido un bug en la pantalla de suscripción que impedía hacer scroll [545ab703f908edcfaa5b44f11fceb5f292717b79]  
  * simplify unlock district validation and update integration test for missing parameters [4a190d37707f2e18f76e9f4d2e2df027d20ef9c4]  
  * update required fields in POI creation and adjust test server port for region integration tests [04a394683f6eeda1b5c47c79862b6f3890b7c793]  
  * update test server ports for district and map integration tests [0b043d2f1591de2a4588ac88f044dc7df97cfa39]

- **2025-04-10:**  
  * cambiado imagenes de placeholder de las fotos [e6058b7b51976f8d4301054a657e89fa430071f6]

---

## refactor

Los commits en **refactor**:

- **2025-04-01:**  
  * cambio de la estructura del formulario publicitario #259 [8f45631bd5bec33f27088c94d4a719a6f5ef34aa]

---

## style

Los commits en **style** ordenados por fecha:

- **2025-03-31:**  
  * Eliminar cometario [start #269] [d4dbdeb0221b4e541d25218d682b104e452a6970]

- **2025-04-01:**  
  * Eliminar comentarios innecesarios [to_review #269] [0c832acf74c5cc9fa99065585bf529d4c93207b5]

---

## test

Los commits en **test** ordenados por fecha:

- **2025-04-02:**  
  * añadir colección completa de tests de postman sobre todos los controllers de la aplicación [f1d2ef96a61c3ede34665f467f871a18596b6736]

- **2025-04-03:**  
  * Hacer tests de integracion de friend en social-service, ademas se ha arreglado el index que seguia empleando rabbitmq y nuevas validaciones [48cd70184f2adaae3fdeabf2a70343e261246667]

- **2025-04-08:**  
  * Se han añadido los tests unitarios restantes del servicio Friend [3d2d85b59867f78dd1b8df79da24ce5be0e3dace]  
  * test faltante añadido a la bateria de tests unitarios [4d08af6d330f59c28805c2e573bc10454da391bb]  
  * tests unitarios arreglados para que funcionen en develop. [6ac4ea59c72954115f5f8c49b495d146057929d2]

- **2025-04-09:**  
  * Primera iteracion de tests de integracion de region #223 [26c4fdf988a25b7e24c5c192d678843b50389105]

