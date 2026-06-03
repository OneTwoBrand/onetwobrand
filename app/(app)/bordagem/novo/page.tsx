import { getProductionOrders } from '@/lib/production/orders';
import { ShipmentForm } from './ShipmentForm';

export default async function NovaBordagemPage() {
  const { orders } = await getProductionOrders();
  const openOrders = orders.filter((order) => !['Finalizada', 'Vendida', 'Entregue'].includes(order.status));

  return <ShipmentForm orders={openOrders} />;
}
