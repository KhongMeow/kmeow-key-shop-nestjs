import { Permission } from "src/permissions/entities/permission.entity";
import { Role } from "src/roles/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  slug: string;

  @ManyToOne(() => Role, role => role.id)
  role: Role;

  @ManyToOne(() => Permission, permission => permission.id)
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
