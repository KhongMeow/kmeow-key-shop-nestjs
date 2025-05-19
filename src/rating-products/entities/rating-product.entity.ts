import { Product } from "src/products/entities/product.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Min, Max } from 'class-validator';
import { User } from "src/users/entities/user.entity";

@Entity()
export class RatingProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Min(1)
  @Max(5)
  rating: number;

  @Column()
  comment: string;

  @ManyToOne(() => Product, product => product.ratings)
  product: Product;

  @ManyToOne(() => User, user => user.ratings)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}