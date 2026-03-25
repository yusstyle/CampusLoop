export { setupAuth, isAuthenticated, getSession, hashPassword, comparePasswords, getAuthUserId } from "../../localAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
