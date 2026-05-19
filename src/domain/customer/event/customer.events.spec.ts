import EventDispatcher from "../../@shared/event/event-dispatcher";
import CustomerCreatedEvent from "./customer-created.event";
import CustomerAddressChangedEvent from "./customer-address-changed.event";
import EnviaConsoleLog1Handler from "./handler/envia-console-log1.handler";
import EnviaConsoleLog2Handler from "./handler/envia-console-log2.handler";
import EnviaConsoleLogHandler from "./handler/envia-console-log.handler";
import Address from "../value-object/address";

describe("Customer domain events", () => {
  describe("CustomerCreatedEvent", () => {
    it("should register and notify EnviaConsoleLog1Handler and EnviaConsoleLog2Handler", () => {
      const eventDispatcher = new EventDispatcher();
      const handler1 = new EnviaConsoleLog1Handler();
      const handler2 = new EnviaConsoleLog2Handler();

      const spyHandler1 = jest.spyOn(handler1, "handle");
      const spyHandler2 = jest.spyOn(handler2, "handle");

      eventDispatcher.register("CustomerCreatedEvent", handler1);
      eventDispatcher.register("CustomerCreatedEvent", handler2);

      expect(
        eventDispatcher.getEventHandlers["CustomerCreatedEvent"],
      ).toBeDefined();
      expect(
        eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length,
      ).toBe(2);

      const customerCreatedEvent = new CustomerCreatedEvent({
        id: "1",
        name: "Joao",
      });
      eventDispatcher.notify(customerCreatedEvent);

      expect(spyHandler1).toHaveBeenCalled();
      expect(spyHandler1).toHaveBeenCalledWith(customerCreatedEvent);
      expect(spyHandler2).toHaveBeenCalled();
      expect(spyHandler2).toHaveBeenCalledWith(customerCreatedEvent);
    });
  });

  describe("CustomerAddressChangedEvent", () => {
    it("should register and notify EnviaConsoleLogHandler", () => {
      const eventDispatcher = new EventDispatcher();
      const handler = new EnviaConsoleLogHandler();

      const spyHandler = jest.spyOn(handler, "handle");

      eventDispatcher.register("CustomerAddressChangedEvent", handler);

      expect(
        eventDispatcher.getEventHandlers["CustomerAddressChangedEvent"],
      ).toBeDefined();
      expect(
        eventDispatcher.getEventHandlers["CustomerAddressChangedEvent"].length,
      ).toBe(1);

      const address = new Address("Main St", 123, "12345-678", "New York");
      const customerAddressChangedEvent = new CustomerAddressChangedEvent({
        id: "1",
        name: "Joao",
        address,
      });
      eventDispatcher.notify(customerAddressChangedEvent);

      expect(spyHandler).toHaveBeenCalled();
      expect(spyHandler).toHaveBeenCalledWith(customerAddressChangedEvent);
    });

    it("should carry correct event data (id, name, address)", () => {
      const address = new Address("Main St", 123, "12345-678", "New York");
      const event = new CustomerAddressChangedEvent({
        id: "1",
        name: "Joao",
        address,
      });

      expect(event.eventData.id).toBe("1");
      expect(event.eventData.name).toBe("Joao");
      expect(event.eventData.address).toBe(address);
      expect(event.eventData.address.toString()).toBe(
        "Main St, 123, 12345-678 New York",
      );
    });

    it("should log the correct message when handler is executed", () => {
      const eventDispatcher = new EventDispatcher();
      const handler = new EnviaConsoleLogHandler();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      eventDispatcher.register("CustomerAddressChangedEvent", handler);

      const address = new Address("Main St", 123, "12345-678", "New York");
      const event = new CustomerAddressChangedEvent({
        id: "1",
        name: "Joao",
        address,
      });
      eventDispatcher.notify(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Endereço do cliente: 1, Joao alterado para: Main St, 123, 12345-678 New York",
      );

      consoleSpy.mockRestore();
    });
  });
});
