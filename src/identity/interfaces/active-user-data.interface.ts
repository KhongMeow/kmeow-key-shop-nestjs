import { Role } from "src/roles/entities/role.entity";

export interface ActiveUserData {
  sub: number;
  username: string;
  email: string;
  role: Role;
}