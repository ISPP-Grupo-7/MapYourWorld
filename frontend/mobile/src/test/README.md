# Tests para MapYourWorld Mobile

Esta carpeta contiene los tests para la aplicación móvil de MapYourWorld.

## Estructura

```
test/
  ├── __mocks__/                # Mocks para archivos estáticos y estilos
  ├── components/               # Tests para componentes
  │   ├── UI/                   # Tests para componentes de UI
  │   └── screens/              # Tests para pantallas
  ├── contexts/                 # Tests para contextos
  ├── services/                 # Tests para servicios
  ├── jest.d.ts                 # Tipos para Jest
  ├── jest.setup.js             # Configuración para Jest
  └── README.md                 # Este archivo
```

## Cómo ejecutar los tests

Para ejecutar todos los tests:

```bash
npm test
```

Para ejecutar un archivo de test específico:

```bash
npm test -- <ruta-al-archivo>
```

Ejemplos de ejecución específica:

```bash
# Test de un componente específico
npm test -- src/test/components/UI/TextInput.test.tsx

# Test de un contexto
npm test -- src/test/contexts/AuthContext.test.tsx

# Test de un servicio
npm test -- src/test/services/auth.service.test.tsx
```

Para ver la cobertura de los tests:

```bash
npm test -- --coverage
```

## Notas importantes

### Componentes con nativewind

Los componentes que utilizan `nativewind` pueden presentar problemas durante las pruebas debido a la forma en que nativewind integra sus estilos. Para componentes que utilizan `styled` de nativewind, se recomienda utilizar una de estas opciones:

1. **Crear componentes de prueba simplificados**: Como se muestra en `SimpleButton.test.tsx`, puedes crear versiones simplificadas de los componentes sin nativewind para probar la lógica principal.

2. **Mockear nativewind**: El archivo `jest.setup.js` incluye un mock general para nativewind que funciona para la mayoría de los componentes.

### Navegación con React Navigation

Para los tests que involucran navegación, se ha creado un mock genérico en varios archivos de test (como en `HamburgerMenu.test.tsx` y `WelcomeScreen.test.tsx`) que permite probar componentes que utilizan `useNavigation`.

## Componentes de UI testeados

- **Button**: Pruebas de las diferentes variantes y propiedades de botones
- **Card**: Pruebas de la tarjeta y sus sub-componentes (Header, Body, Footer)
- **TextInput**: Pruebas de campos de texto, validación de errores y visibilidad de contraseñas
- **HamburgerMenu**: Pruebas del menú desplegable y navegación
- **SimpleButton**: Prueba simplificada de un botón básico (para referencia)

## Pantallas testeadas

- **WelcomeScreen**: Pruebas de la pantalla de bienvenida y navegación

## Contextos testeados

- **AuthContext**: Pruebas del contexto de autenticación, incluyendo inicio de sesión, registro y cierre de sesión

## Servicios testeados

- **auth.service**: Pruebas completas del servicio de autenticación (login, registro, getToken, refreshToken, etc.)

## Escribir tests

### Para componentes

1. Crea un archivo con el nombre `<Componente>.test.tsx` en la carpeta `test/components/` correspondiente.
2. Importa el componente y las utilidades de testing.
3. Utiliza `render` para renderizar el componente.
4. Utiliza `fireEvent` para simular eventos como clics o entradas de texto.
5. Utiliza `expect` para verificar que el componente se comporta como se espera.

Ejemplo:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/UI/Button';

describe('Button Component', () => {
  test('debería llamar a onPress cuando se presiona', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Prueba" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Prueba'));
    
    expect(onPressMock).toHaveBeenCalled();
  });
});
```

### Para servicios

1. Crea un archivo con el nombre `<servicio>.test.ts` en la carpeta `test/services/`.
2. Importa el servicio y mockea las dependencias externas (fetch, AsyncStorage, etc).
3. Utiliza `jest.mock` para mockear módulos externos.
4. Configura respuestas simuladas para `fetch` u otras funciones.
5. Verifica que el servicio llama a las funciones correctas con los parámetros esperados.

Ejemplo:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../../services/auth.service';

jest.mock('@react-native-async-storage/async-storage');
global.fetch = jest.fn();

describe('Auth Service', () => {
  test('login debería guardar los tokens en AsyncStorage', async () => {
    // Configurar mock para fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tokens: { accessToken: 'token' }, user: {} })
    });
    
    await login('email@example.com', 'password');
    
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
```

### Para contextos

1. Crea un archivo con el nombre `<contexto>.test.tsx` en la carpeta `test/contexts/`.
2. Crea un componente de prueba que utilice el hook del contexto.
3. Renderiza el proveedor del contexto con el componente de prueba.
4. Verifica que el estado inicial es correcto.
5. Utiliza `fireEvent` para simular acciones que modifiquen el estado.
6. Verifica que el estado cambió correctamente.

Ejemplo:

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

const TestComponent = () => {
  const { user, signIn } = useAuth();
  return (
    <View>
      {user && <Text>Usuario: {user.username}</Text>}
      <TouchableOpacity onPress={() => signIn('test@example.com', 'password')}>
        <Text>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

test('permite iniciar sesión', async () => {
  const { getByText } = render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  
  fireEvent.press(getByText('Iniciar sesión'));
  
  await waitFor(() => {
    expect(getByText(/Usuario:/)).toBeTruthy();
  });
}); 