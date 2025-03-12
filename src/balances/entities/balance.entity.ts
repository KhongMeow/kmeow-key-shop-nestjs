import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  amount: number;

  @OneToOne(() => User, (user) => user.balance)
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
