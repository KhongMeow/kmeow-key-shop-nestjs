import { Balance } from "src/balances/entities/balance.entity";
import { Order } from "src/orders/entities/order.entity";
import { RatingProduct } from "src/rating-products/entities/rating-product.entity";
import { Role } from "src/roles/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => RatingProduct, ratingProduct => ratingProduct.user)
  ratings: RatingProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
