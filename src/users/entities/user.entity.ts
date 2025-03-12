import { Balance } from "src/balances/entities/balance.entity";
import { Role } from "src/roles/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullname: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, role => role.id)
  role: Role;

  @OneToOne(() => Balance, balance => balance.user, { cascade: true })
  balance: Balance;
  
  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;
  
  @DeleteDateColumn()
  deleted_at: Date;
}
