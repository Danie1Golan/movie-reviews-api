declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        name: string;
        email: string;
        role: 'user' | 'admin';
      };
    }
  }
}
export {};
