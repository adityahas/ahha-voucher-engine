import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RedistroService } from './redistro.service';
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

@Controller('redistro')
export class RedistroController {
  constructor(private readonly retailService: RedistroService) {}

  @Post('inventory-stocks')
  createInventoryStock(
    @Body() createInventoryStockDto: CreateInventoryStockDto,
  ) {
    return this.retailService.createInventoryStock(createInventoryStockDto);
  }

  @Get('inventory-stocks')
  findAllInventoryStocks() {
    return this.retailService.findAllInventoryStocks();
  }

  @Get('inventory-stocks/:id')
  findOneInventoryStock(@Param('id') id: string) {
    return this.retailService.findOneInventoryStock(id);
  }

  @Patch('inventory-stocks/:id')
  updateInventoryStock(
    @Param('id') id: string,
    @Body() updateInventoryStockDto: UpdateInventoryStockDto,
  ) {
    return this.retailService.updateInventoryStock(id, updateInventoryStockDto);
  }

  @Delete('inventory-stocks/:id')
  removeInventoryStock(@Param('id') id: string) {
    return this.retailService.removeInventoryStock(id);
  }

  @Post('sales-orders')
  createSalesOrder(@Body() createSalesOrderDto: CreateSalesOrderDto) {
    return this.retailService.createSalesOrder(createSalesOrderDto);
  }

  @Get('sales-orders')
  findAllSalesOrders() {
    return this.retailService.findAllSalesOrders();
  }

  @Get('sales-orders/:id')
  findOneSalesOrder(@Param('id') id: string) {
    return this.retailService.findOneSalesOrder(id);
  }

  @Patch('sales-orders/:id')
  updateSalesOrder(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
  ) {
    return this.retailService.updateSalesOrder(id, updateSalesOrderDto);
  }

  @Delete('sales-orders/:id')
  removeSalesOrder(@Param('id') id: string) {
    return this.retailService.removeSalesOrder(id);
  }

  @Post('sales-order-items')
  createSalesOrderItem(
    @Body() createSalesOrderItemDto: CreateSalesOrderItemDto,
  ) {
    return this.retailService.createSalesOrderItem(createSalesOrderItemDto);
  }

  @Get('sales-order-items')
  findAllSalesOrderItems() {
    return this.retailService.findAllSalesOrderItems();
  }

  @Get('sales-order-items/:id')
  findOneSalesOrderItem(@Param('id') id: string) {
    return this.retailService.findOneSalesOrderItem(id);
  }

  @Patch('sales-order-items/:id')
  updateSalesOrderItem(
    @Param('id') id: string,
    @Body() updateSalesOrderItemDto: UpdateSalesOrderItemDto,
  ) {
    return this.retailService.updateSalesOrderItem(id, updateSalesOrderItemDto);
  }

  @Delete('sales-order-items/:id')
  removeSalesOrderItem(@Param('id') id: string) {
    return this.retailService.removeSalesOrderItem(id);
  }

  @Post('deliveries')
  createDelivery(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.retailService.createDelivery(createDeliveryDto);
  }

  @Get('deliveries')
  findAllDeliveries() {
    return this.retailService.findAllDeliveries();
  }

  @Get('deliveries/:id')
  findOneDelivery(@Param('id') id: string) {
    return this.retailService.findOneDelivery(id);
  }

  @Patch('deliveries/:id')
  updateDelivery(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ) {
    return this.retailService.updateDelivery(id, updateDeliveryDto);
  }

  @Delete('deliveries/:id')
  removeDelivery(@Param('id') id: string) {
    return this.retailService.removeDelivery(id);
  }

  @Post('sales-visits')
  createSalesVisit(@Body() createSalesVisitDto: CreateSalesVisitDto) {
    return this.retailService.createSalesVisit(createSalesVisitDto);
  }

  @Get('sales-visits')
  findAllSalesVisits() {
    return this.retailService.findAllSalesVisits();
  }

  @Get('sales-visits/:id')
  findOneSalesVisit(@Param('id') id: string) {
    return this.retailService.findOneSalesVisit(id);
  }

  @Patch('sales-visits/:id')
  updateSalesVisit(
    @Param('id') id: string,
    @Body() updateSalesVisitDto: UpdateSalesVisitDto,
  ) {
    return this.retailService.updateSalesVisit(id, updateSalesVisitDto);
  }

  @Delete('sales-visits/:id')
  removeSalesVisit(@Param('id') id: string) {
    return this.retailService.removeSalesVisit(id);
  }
}
