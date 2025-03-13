import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  amount: number;

  @OneToOne(() => User, user => user.balance)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
