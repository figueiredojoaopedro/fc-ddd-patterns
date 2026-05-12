import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      },
    );
  }

  async update(entity: Order): Promise<void> {
    // get all ids of the existing items
    const existingIds = (
      await OrderItemModel.findAll({
        where: { order_id: entity.id },
        attributes: ["id"],
      })
    ).map((item) => item.id);

    // get all ids of the incoming items - these ids will be used to determine which items to remove and upsert
    const incomingIds = entity.items.map((item) => item.id);
    // items that will no longer be on the order
    const toRemove = existingIds.filter((id) => !incomingIds.includes(id));
    // items that will be updated or added to the order
    const toUpsert = entity.items;

    // remove all orderIds that no longer will be part of the order
    if (toRemove.length > 0) {
      await OrderItemModel.destroy({
        where: { order_id: entity.id, id: toRemove },
      });
    }

    // upsert all incoming items in the Orders' table
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        items: toUpsert.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
          order_id: entity.id,
        })),
        total: entity.total(),
      },
      {
        where: { id: entity.id },
      },
    );

    // upsert all incoming items to the OrderItems table
    for (const item of toUpsert) {
      await OrderItemModel.upsert({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
        order_id: entity.id,
      });
    }
  }

  async find(id: string): Promise<Order> {
    const order = await OrderModel.findOne({
      where: { id },
      include: ["items"],
      rejectOnEmpty: true,
    });

    const items = order.items.map(
      (item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity,
        ),
    );

    const orderObject = new Order(order.id, order.customer_id, items);
    return orderObject;
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({
      include: ["items"],
    });

    const ordersObjects = orders.map((order) => {
      const items = order.items.map((item) => {
        return new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity,
        );
      });

      const orderObject = new Order(order.id, order.customer_id, items);
      return orderObject;
    });

    return ordersObjects;
  }
}
