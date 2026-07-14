import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InventoryStock } from './entities/inventory-stock.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Delivery } from './entities/delivery.entity';
import { SalesVisit } from './entities/sales-visit.entity';
import { CreateInventoryStockDto } from './dto/create-inventory-stock.dto';
import { UpdateInventoryStockDto } from './dto/update-inventory-stock.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { CreateSalesOrderItemDto } from './dto/create-sales-order-item.dto';
import { UpdateSalesOrderItemDto } from './dto/update-sales-order-item.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { CreateSalesVisitDto } from './dto/create-sales-visit.dto';
import { UpdateSalesVisitDto } from './dto/update-sales-visit.dto';

@Injectable()
export class RedistroService {
  private inventoryStockRepository: Repository<InventoryStock>;
  private salesOrderRepository: Repository<SalesOrder>;
  private salesOrderItemRepository: Repository<SalesOrderItem>;
  private deliveryRepository: Repository<Delivery>;
  private salesVisitRepository: Repository<SalesVisit>;

  constructor(dataSource: DataSource) {
    this.inventoryStockRepository = dataSource.getRepository(InventoryStock);
    this.salesOrderRepository = dataSource.getRepository(SalesOrder);
    this.salesOrderItemRepository = dataSource.getRepository(SalesOrderItem);
    this.deliveryRepository = dataSource.getRepository(Delivery);
    this.salesVisitRepository = dataSource.getRepository(SalesVisit);
  }

  createInventoryStock(
    createInventoryStockDto: CreateInventoryStockDto,
  ): Promise<InventoryStock> {
    return this.inventoryStockRepository.save(createInventoryStockDto);
  }

  findAllInventoryStocks(): Promise<InventoryStock[]> {
    return this.inventoryStockRepository.find();
  }

  findOneInventoryStock(id: string): Promise<InventoryStock> {
    return this.inventoryStockRepository.findOneBy({ id });
  }

  updateInventoryStock(
    id: string,
    updateInventoryStockDto: UpdateInventoryStockDto,
  ): Promise<InventoryStock> {
    return this.inventoryStockRepository.save({
      ...updateInventoryStockDto,
      id,
    });
  }

  removeInventoryStock(id: string): Promise<void> {
    return this.inventoryStockRepository.delete(id).then(() => {});
  }

  createSalesOrder(
    createSalesOrderDto: CreateSalesOrderDto,
  ): Promise<SalesOrder> {
    return this.salesOrderRepository.save(createSalesOrderDto);
  }

  findAllSalesOrders(): Promise<SalesOrder[]> {
    return this.salesOrderRepository.find();
  }

  findOneSalesOrder(id: string): Promise<SalesOrder> {
    return this.salesOrderRepository.findOneBy({ id });
  }

  updateSalesOrder(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    return this.salesOrderRepository.save({ ...updateSalesOrderDto, id });
  }

  removeSalesOrder(id: string): Promise<void> {
    return this.salesOrderRepository.delete(id).then(() => {});
  }

  createSalesOrderItem(
    createSalesOrderItemDto: CreateSalesOrderItemDto,
  ): Promise<SalesOrderItem> {
    return this.salesOrderItemRepository.save(createSalesOrderItemDto);
  }

  findAllSalesOrderItems(): Promise<SalesOrderItem[]> {
    return this.salesOrderItemRepository.find();
  }

  findOneSalesOrderItem(id: string): Promise<SalesOrderItem> {
    return this.salesOrderItemRepository.findOneBy({ id });
  }

  updateSalesOrderItem(
    id: string,
    updateSalesOrderItemDto: UpdateSalesOrderItemDto,
  ): Promise<SalesOrderItem> {
    return this.salesOrderItemRepository.save({
      ...updateSalesOrderItemDto,
      id,
    });
  }

  removeSalesOrderItem(id: string): Promise<void> {
    return this.salesOrderItemRepository.delete(id).then(() => {});
  }

  createDelivery(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    return this.deliveryRepository.save(createDeliveryDto);
  }

  findAllDeliveries(): Promise<Delivery[]> {
    return this.deliveryRepository.find();
  }

  findOneDelivery(id: string): Promise<Delivery> {
    return this.deliveryRepository.findOneBy({ id });
  }

  updateDelivery(
    id: string,
    updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    return this.deliveryRepository.save({ ...updateDeliveryDto, id });
  }

  removeDelivery(id: string): Promise<void> {
    return this.deliveryRepository.delete(id).then(() => {});
  }

  createSalesVisit(
    createSalesVisitDto: CreateSalesVisitDto,
  ): Promise<SalesVisit> {
    return this.salesVisitRepository.save(createSalesVisitDto);
  }

  findAllSalesVisits(): Promise<SalesVisit[]> {
    return this.salesVisitRepository.find();
  }

  findOneSalesVisit(id: string): Promise<SalesVisit> {
    return this.salesVisitRepository.findOneBy({ id });
  }

  updateSalesVisit(
    id: string,
    updateSalesVisitDto: UpdateSalesVisitDto,
  ): Promise<SalesVisit> {
    return this.salesVisitRepository.save({ ...updateSalesVisitDto, id });
  }

  removeSalesVisit(id: string): Promise<void> {
    return this.salesVisitRepository.delete(id).then(() => {});
  }
}
