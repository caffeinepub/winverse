export {};

declare module "./backend" {
  interface backendInterface {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;
  }
  // Augment the Backend class so it satisfies the extended backendInterface
  interface Backend {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;
  }
}
