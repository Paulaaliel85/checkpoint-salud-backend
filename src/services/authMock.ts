// creo usuarios de prueba para login solo en el frontend, no se hace en el backend
interface UsuarioMock {
    id: string;
    email: string;
    password: string;
    rol: 'CLINICA' | 'EMPRESA' | 'ADMIN' | 'PACIENTE'; // defino los roles posibles
    activo: boolean; // agregado para la baja lógica
}

interface RespuestaMock { // la respuesta que devuelve el login mock
    mensaje: string;
    token: string;
    usuario: {
        id: string;
        email: string;
        rol: 'CLINICA' | 'EMPRESA' | 'ADMIN' | 'PACIENTE';
    };
}

// guardo los usuarios mock en un array
const usuariosMock: UsuarioMock[] = [
    {
        id: '1',
        email: 'clinicaMock@gmail.com',
        password: 'clinica123',
        rol: 'CLINICA',
        activo: true,
    },
    {
        id: '2',
        email: 'empresaMock@gmail.com',
        password: 'empresa123',
        rol: 'EMPRESA',
        activo: true,
    },
    {
        id: '3',
        email: 'adminMock@gmail.com',
        password: 'admin123',
        rol: 'ADMIN',
        activo: true,
    },
    {
        id: '4',
        email: 'pacienteMock@gmail.com',
        password: 'paciente123',
        rol: 'PACIENTE',
        activo: true,
    }
];

// funcion que simula el login
export async function iniciarSesionMock(
    email: string, // entra el correo
    password: string, // entra la contraseña
): Promise<RespuestaMock> { // devuelve una promesa, es la respuesta del login
    const correoIngresado = email.trim().toLowerCase(); // normalizo el correo ingresado
    const passwordIngresada = password.trim(); // normalizo la contraseña ingresada

    // recupero los usuarios guardados en el localStorage desde el panel de administracion si existen
    const usuariosGuardados = localStorage.getItem('checkpoint_usuarios');
    // si hay usuarios en el localStorage los parseo, si no uso el array de usuariosMock por defecto
    const listaUsuarios: UsuarioMock[] = usuariosGuardados
        ? JSON.parse(usuariosGuardados)
        : usuariosMock;

    const usuario = listaUsuarios.find( // busco ese usuario ingresado en la lista de usuarios
        (u) =>
            u.email.trim().toLowerCase() === correoIngresado &&
            u.password.trim() === passwordIngresada, // comparo el correo y la contraseña con los que ya tengo guardados
    );

    // mensaje en la consola de que el correo ingreso (solo para errores posibles)
    console.log('Correo normalizado:', JSON.stringify(correoIngresado));
    console.log(
        'Correos registrados:',
        listaUsuarios.map((u) => JSON.stringify(u.email.trim().toLowerCase())),
    );
    console.log('Usuario encontrado:', usuario?.rol ?? 'NINGUNO');

    if (!usuario) { // si el usuario no se encuentra, lanza un error
        throw new Error('Credenciales inválidas');
    }

    if (usuario.activo === false) { // si el usuario está inactivo, lanzo un error bloqueando el acceso
        throw new Error('Tu cuenta se encuentra desactivada. Contactá al administrador.');
    }

    return { // si el usuario se encuentra, devuelve un objeto con el mensaje, token y usuario
        mensaje: 'Inicio de sesión exitoso',
        token: 'token-mock-123456',
        usuario: {
            id: String(usuario.id),
            email: usuario.email,
            rol: usuario.rol,
        },
    };
}