import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  private orderRepository: Repository<OrderEntity>;

  constructor(private dataSource: DataSource) {
    this.orderRepository = this.dataSource.getRepository(OrderEntity);
  }

  async create(data: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = this.orderRepository.create(data);
    return this.orderRepository.save(order);
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    return this.orderRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }
}
