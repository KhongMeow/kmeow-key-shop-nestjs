import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

@Entity()
export class Order {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column()
  email: string;

  @Column()
  status: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentDeadline: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
