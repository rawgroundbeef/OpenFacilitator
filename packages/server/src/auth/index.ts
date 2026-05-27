import { createAuth, resolveAuthDbPath, type AuthInstance } from './config.js';

let authInstance: AuthInstance | null = null;
let initializedDbPath: string | null = null;

export function initializeAuth(dbPath?: string): AuthInstance {
  const resolvedDbPath = resolveAuthDbPath(dbPath);

  if (authInstance && initializedDbPath === resolvedDbPath) {
    return authInstance;
  }

  authInstance = createAuth(resolvedDbPath);
  initializedDbPath = resolvedDbPath;
  console.log('✅ Better Auth initialized');

  return authInstance;
}

export function getAuth(): AuthInstance {
  return authInstance ?? initializeAuth();
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuth() as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getAuth() as object, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getAuth() as object);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getAuth() as object, prop);
    if (descriptor) {
      descriptor.configurable = true;
    }
    return descriptor;
  },
});

export default auth;
export type { AuthInstance };
