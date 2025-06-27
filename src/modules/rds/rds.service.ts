import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RdsService {
  // constructor(
  //   @InjectRepository(InventoryStock)
  //   private inventoryStockRepository: Repository<InventoryStock>,
  //   @InjectRepository(SalesOrder)
  //   private salesOrderRepository: Repository<SalesOrder>,
  //   @InjectRepository(SalesOrderItem)
  //   private salesOrderItemRepository: Repository<SalesOrderItem>,
  //   @InjectRepository(Delivery)
  //   private deliveryRepository: Repository<Delivery>,
  //   @InjectRepository(SalesVisit)
  //   private salesVisitRepository: Repository<SalesVisit>,
  // ) {}
  //
  // // InventoryStock
  // createInventoryStock(createInventoryStockDto: CreateInventoryStockDto): Promise<InventoryStock> {
  //   return this.inventoryStockRepository.save(createInventoryStockDto);
  // }
  //
  // findAllInventoryStocks(): Promise<InventoryStock[]> {
  //   return this.inventoryStockRepository.find();
  // }
  //
  // findOneInventoryStock(id: string): Promise<InventoryStock> {
  //   return this.inventoryStockRepository.findOneBy({ id });
  // }
  //
  // updateInventoryStock(id: string, updateInventoryStockDto: UpdateInventoryStockDto): Promise<InventoryStock> {
  //   return this.inventoryStockRepository.save({ ...updateInventoryStockDto, id });
  // }
  //
  // removeInventoryStock(id: string): Promise<void> {
  //   return this.inventoryStockRepository.delete(id).then(() => {});
  // }
  //
  // // SalesOrder
  // createSalesOrder(createSalesOrderDto: CreateSalesOrderDto): Promise<SalesOrder> {
  //   return this.salesOrderRepository.save(createSalesOrderDto);
  // }
  //
  // findAllSalesOrders(): Promise<SalesOrder[]> {
  //   return this.salesOrderRepository.find();
  // }
  //
  // findOneSalesOrder(id: string): Promise<SalesOrder> {
  //   return this.salesOrderRepository.findOneBy({ id });
  // }
  //
  // updateSalesOrder(id: string, updateSalesOrderDto: UpdateSalesOrderDto): Promise<SalesOrder> {
  //   return this.salesOrderRepository.save({ ...updateSalesOrderDto, id });
  // }
  //
  // removeSalesOrder(id: string): Promise<void> {
  //   return this.salesOrderRepository.delete(id).then(() => {});
  // }
  //
  // // SalesOrderItem
  // createSalesOrderItem(createSalesOrderItemDto: CreateSalesOrderItemDto): Promise<SalesOrderItem> {
  //   return this.salesOrderItemRepository.save(createSalesOrderItemDto);
  // }
  //
  // findAllSalesOrderItems(): Promise<SalesOrderItem[]> {
  //   return this.salesOrderItemRepository.find();
  // }
  //
  // findOneSalesOrderItem(id: string): Promise<SalesOrderItem> {
  //   return this.salesOrderItemRepository.findOneBy({ id });
  // }
  //
  // updateSalesOrderItem(id: string, updateSalesOrderItemDto: UpdateSalesOrderItemDto): Promise<SalesOrderItem> {
  //   return this.salesOrderItemRepository.save({ ...updateSalesOrderItemDto, id });
  // }
  //
  // removeSalesOrderItem(id: string): Promise<void> {
  //   return this.salesOrderItemRepository.delete(id).then(() => {});
  // }
  //
  // // Delivery
  // createDelivery(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
  //   return this.deliveryRepository.save(createDeliveryDto);
  // }
  //
  // findAllDeliveries(): Promise<Delivery[]> {
  //   return this.deliveryRepository.find();
  // }
  //
  // findOneDelivery(id: string): Promise<Delivery> {
  //   return this.deliveryRepository.findOneBy({ id });
  // }
  //
  // updateDelivery(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery> {
  //   return this.deliveryRepository.save({ ...updateDeliveryDto, id });
  // }
  //
  // removeDelivery(id: string): Promise<void> {
  //   return this.deliveryRepository.delete(id).then(() => {});
  // }
  //
  // // SalesVisit
  // createSalesVisit(createSalesVisitDto: CreateSalesVisitDto): Promise<SalesVisit> {
  //   return this.salesVisitRepository.save(createSalesVisitDto);
  // }
  //
  // findAllSalesVisits(): Promise<SalesVisit[]> {
  //   return this.salesVisitRepository.find();
  // }
  //
  // findOneSalesVisit(id: string): Promise<SalesVisit> {
  //   return this.salesVisitRepository.findOneBy({ id });
  // }
  //
  // updateSalesVisit(id: string, updateSalesVisitDto: UpdateSalesVisitDto): Promise<SalesVisit> {
  //   return this.salesVisitRepository.save({ ...updateSalesVisitDto, id });
  // }
  //
  // removeSalesVisit(id: string): Promise<void> {
  //   return this.salesVisitRepository.delete(id).then(() => {});
  // }
}
