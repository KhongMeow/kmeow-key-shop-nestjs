export class ImportProductItemDto {
  name: string;
  category: number | string;
  detail?: string;
  description?: string;
  price?: number;
  image?: string; // file path or empty
}

export class ImportProductsDto {
  products: ImportProductItemDto[];
}