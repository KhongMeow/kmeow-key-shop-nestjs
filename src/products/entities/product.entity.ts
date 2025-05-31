import { Category } from "src/categories/entities/category.entity";
import { LicenseKey } from "src/license-keys/entities/license-key.entity";
import { OrderItem } from "src/orders/entities/order-item.entity";
import { RatingProduct } from "src/rating-products/entities/rating-product.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  detail: string;

  @Column()
  description: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column()
  image: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  scaleRating: number;

  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @OneToMany(() => RatingProduct, ratingProduct => ratingProduct.product)
  ratings: RatingProduct[];

  @OneToMany(() => LicenseKey, licenseKey => licenseKey.product)
  licenseKeys: LicenseKey[];

  @OneToMany(() => OrderItem, item => item.product)
  orderItems: OrderItem[];
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt: Date;
}
