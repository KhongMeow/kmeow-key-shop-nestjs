import { OrderItem } from "src/orders/entities/order-item.entity";
import { Product } from "src/products/entities/product.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class LicenseKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column({ default: 'Active' })
  status: string;

  @ManyToOne(() => Product, product => product.licenseKeys)
  product: Product;

  @ManyToOne(() => OrderItem, orderItem => orderItem.licenseKeys)
  orderItem: OrderItem;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
